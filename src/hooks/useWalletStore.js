// QNTMEX Wallet - Global State / Store
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { encryptData, decryptData, deriveAllAddresses } from '../crypto';
import { fetchPrices, fetchEthAll, fetchBscAll, fetchBtcBalance, fetchSolAll, fetchTrxAll } from '../api';

const STORAGE_KEY = 'qntmex_wallet_v4';

const initialState = {
  screen: 'lock',          // lock | welcome | create | import | setpin | home
  wallet: null,            // { mnemonic, addrs, privKeys }
  balances: {
    ETH: { native: 0, tokens: {} },
    BSC: { native: 0, tokens: {} },
    BTC: 0,
    SOL: { native: 0, tokens: {} },
    TRX: { native: 0, tokens: {} },
  },
  prices: {},
  txHistory: [],
  loading: false,
  balLoading: false,
  currentUser: null,      // { username }
  activeChain: 'ETH',
  sendChain: 'ETH',
  hasStoredWallet: false,
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':       return { ...state, screen: action.payload };
    case 'SET_WALLET':       return { ...state, wallet: action.payload };
    case 'SET_BALANCES':     return { ...state, balances: { ...state.balances, ...action.payload } };
    case 'SET_PRICES':       return { ...state, prices: action.payload };
    case 'SET_TX_HISTORY':   return { ...state, txHistory: action.payload };
    case 'SET_LOADING':      return { ...state, loading: action.payload };
    case 'SET_BAL_LOADING':  return { ...state, balLoading: action.payload };
    case 'SET_USER':         return { ...state, currentUser: action.payload };
    case 'SET_CHAIN':        return { ...state, activeChain: action.payload, sendChain: action.payload };
    case 'SET_SEND_CHAIN':   return { ...state, sendChain: action.payload };
    case 'HAS_WALLET':       return { ...state, hasStoredWallet: action.payload };
    case 'SHOW_TOAST':       return { ...state, toast: action.payload };
    case 'CLEAR_TOAST':      return { ...state, toast: null };
    default:                 return state;
  }
}

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Check on boot if wallet exists
  useEffect(() => {
    checkStoredWallet();
  }, []);

  const checkStoredWallet = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        dispatch({ type: 'HAS_WALLET', payload: true });
        dispatch({ type: 'SET_SCREEN', payload: 'lock' });
      } else {
        // Check legacy
        const legacy = await SecureStore.getItemAsync('user_mnemonic');
        dispatch({ type: 'HAS_WALLET', payload: !!legacy });
        dispatch({ type: 'SET_SCREEN', payload: legacy ? 'lock' : 'welcome' });
      }
    } catch (e) {
      dispatch({ type: 'SET_SCREEN', payload: 'welcome' });
    }
  };

  const unlock = useCallback(async (pin) => {
    try {
      const storedStr = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!storedStr) {
        // Try legacy migration
        const mnemonic = await SecureStore.getItemAsync('user_mnemonic');
        if (mnemonic) {
          await migrateWallet(mnemonic, pin);
          return true;
        }
        throw new Error('No wallet found');
      }
      const stored = JSON.parse(storedStr);
      const data = await decryptData(stored, pin);
      let wallet = data;
      if (wallet.mnemonic) {
        const { addrs, privs } = await deriveAllAddresses(wallet.mnemonic);
        wallet = { ...wallet, addrs, privKeys: { ETH: privs.ETH, BTC: privs.BTC, TRX: privs.TRX, BSC: privs.BSC, SOL_seed: Array.from(privs.SOL) } };
      }
      dispatch({ type: 'SET_WALLET', payload: wallet });
      dispatch({ type: 'SET_SCREEN', payload: 'home' });
      refreshBalances(wallet.addrs);
      fetchPrices().then(p => dispatch({ type: 'SET_PRICES', payload: p }));
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const migrateWallet = async (mnemonic, pin) => {
    try {
      const { addrs, privs } = await deriveAllAddresses(mnemonic.trim());
      const wallet = { mnemonic: mnemonic.trim(), addrs, privKeys: { ETH: privs.ETH, BTC: privs.BTC, TRX: privs.TRX, BSC: privs.BSC, SOL_seed: Array.from(privs.SOL) } };
      const enc = await encryptData({ mnemonic: mnemonic.trim() }, pin);
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(enc));
      dispatch({ type: 'SET_WALLET', payload: wallet });
      dispatch({ type: 'SET_SCREEN', payload: 'home' });
      dispatch({ type: 'HAS_WALLET', payload: true });
      refreshBalances(wallet.addrs);
      fetchPrices().then(p => dispatch({ type: 'SET_PRICES', payload: p }));
    } catch (e) {
      throw new Error('Migration failed');
    }
  };

  const saveWallet = useCallback(async (wallet, pin) => {
    const enc = await encryptData({ mnemonic: wallet.mnemonic }, pin);
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(enc));
    dispatch({ type: 'SET_WALLET', payload: wallet });
    dispatch({ type: 'HAS_WALLET', payload: true });
    dispatch({ type: 'SET_SCREEN', payload: 'home' });
    refreshBalances(wallet.addrs);
    fetchPrices().then(p => dispatch({ type: 'SET_PRICES', payload: p }));
  }, []);

  const refreshBalances = useCallback(async (addrs) => {
    if (!addrs) return;
    dispatch({ type: 'SET_BAL_LOADING', payload: true });
    try {
      const [eth, bsc, btc, sol, trx] = await Promise.all([
        fetchEthAll(addrs.ETH).catch(() => ({ native: 0, tokens: {} })),
        fetchBscAll(addrs.BSC).catch(() => ({ native: 0, tokens: {} })),
        fetchBtcBalance(addrs.BTC).catch(() => 0),
        fetchSolAll(addrs.SOL).catch(() => ({ native: 0, tokens: {} })),
        fetchTrxAll(addrs.TRX).catch(() => ({ native: 0, tokens: {} })),
      ]);
      dispatch({ type: 'SET_BALANCES', payload: { ETH: eth, BSC: bsc, BTC: btc, SOL: sol, TRX: trx } });
    } finally {
      dispatch({ type: 'SET_BAL_LOADING', payload: false });
    }
  }, []);

  const lockWallet = useCallback(() => {
    dispatch({ type: 'SET_SCREEN', payload: 'lock' });
  }, []);

  const showToast = useCallback((msg, duration = 2500) => {
    dispatch({ type: 'SHOW_TOAST', payload: msg });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), duration);
  }, []);

  const deleteWallet = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    dispatch({ type: 'SET_WALLET', payload: null });
    dispatch({ type: 'HAS_WALLET', payload: false });
    dispatch({ type: 'SET_SCREEN', payload: 'welcome' });
  }, []);

  const value = {
    state,
    dispatch,
    unlock,
    saveWallet,
    refreshBalances,
    lockWallet,
    showToast,
    deleteWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}

// Helper: compute total portfolio value
export function computePortfolioValue(balances, prices) {
  const { ETH, BSC, BTC, SOL, TRX } = balances;
  const p = prices;
  let total = 0;
  total += (ETH?.native || 0) * (p.ETH?.usd || 0);
  total += (BSC?.native || 0) * (p.BNB?.usd || 0);
  total += (typeof BTC === 'number' ? BTC : 0) * (p.BTC?.usd || 0);
  total += (SOL?.native || 0) * (p.SOL?.usd || 0);
  total += (TRX?.native || 0) * (p.TRX?.usd || 0);
  // Stablecoins
  total += ((ETH?.tokens?.USDT || 0) + (ETH?.tokens?.USDC || 0));
  total += ((BSC?.tokens?.USDT || 0) + (BSC?.tokens?.USDC || 0));
  total += ((SOL?.tokens?.USDT || 0) + (SOL?.tokens?.USDC || 0));
  total += ((TRX?.tokens?.USDT || 0) + (TRX?.tokens?.USDC || 0));
  return total;
}
