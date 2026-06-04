// QNTMEX Wallet - API Layer
// Ported from walletqntmex.com V6 HTML wallet

import { CFG } from '../config';

const _cache = {};
function cacheGet(k) { const e = _cache[k]; return e && Date.now() < e.exp ? e.v : null; }
function cacheSet(k, v, ttl = 30000) { _cache[k] = { v, exp: Date.now() + ttl }; }

// ── PRICES ────────────────────────────────────────────────
export async function fetchPrices() {
  const cached = cacheGet('prices');
  if (cached) return cached;
  try {
    const ids = 'bitcoin,ethereum,solana,binancecoin,tron';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { headers: { 'x-cg-demo-api-key': CFG.CG_KEY } }
    );
    const data = await res.json();
    const out = {
      BTC: { usd: data.bitcoin?.usd || 0, change: data.bitcoin?.usd_24h_change || 0 },
      ETH: { usd: data.ethereum?.usd || 0, change: data.ethereum?.usd_24h_change || 0 },
      SOL: { usd: data.solana?.usd || 0, change: data.solana?.usd_24h_change || 0 },
      BNB: { usd: data.binancecoin?.usd || 0, change: data.binancecoin?.usd_24h_change || 0 },
      TRX: { usd: data.tron?.usd || 0, change: data.tron?.usd_24h_change || 0 },
      USDC: { usd: 1, change: 0 },
      USDT: { usd: 1, change: 0 },
    };
    cacheSet('prices', out, 60000);
    return out;
  } catch (e) {
    return { BTC:{usd:0,change:0}, ETH:{usd:0,change:0}, SOL:{usd:0,change:0}, BNB:{usd:0,change:0}, TRX:{usd:0,change:0}, USDC:{usd:1,change:0}, USDT:{usd:1,change:0} };
  }
}

// ── ETH ───────────────────────────────────────────────────
export async function fetchEthAll(address) {
  const cached = cacheGet('eth_' + address);
  if (cached) return cached;
  try {
    const headers = { 'Content-Type': 'application/json' };
    const [balRes, tokRes] = await Promise.all([
      fetch(CFG.ETH_RPC, {
        method: 'POST', headers,
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_getBalance', params:[address,'latest'] })
      }),
      fetch(CFG.ETH_RPC, {
        method: 'POST', headers,
        body: JSON.stringify({ jsonrpc:'2.0', id:2, method:'alchemy_getTokenBalances', params:[address] })
      })
    ]);
    const balData = await balRes.json();
    const tokData = await tokRes.json();
    const native = parseInt(balData.result || '0x0', 16) / 1e18;
    const tokens = (tokData.result?.tokenBalances || [])
      .filter(t => t.tokenBalance && t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000')
      .map(t => ({ contract: t.contractAddress.toLowerCase(), raw: t.tokenBalance }));

    // Resolve known tokens
    const known = [
      { sym:'USDT', contract:'0xdac17f958d2ee523a2206206994597c13d831ec7', decimals:6 },
      { sym:'USDC', contract:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals:6 },
    ];
    const tokenBals = {};
    for (const k of known) {
      const found = tokens.find(t => t.contract === k.contract);
      if (found) tokenBals[k.sym] = parseInt(found.raw, 16) / Math.pow(10, k.decimals);
    }

    const result = { native, tokens: tokenBals };
    cacheSet('eth_' + address, result, 30000);
    return result;
  } catch (e) {
    return { native: 0, tokens: {} };
  }
}

// ── BSC ───────────────────────────────────────────────────
export async function fetchBscAll(address) {
  const cached = cacheGet('bsc_' + address);
  if (cached) return cached;
  
  const rpcs = [CFG.BSC_RPC, ...CFG.BSC_FALLBACKS];
  for (const rpc of rpcs) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_getBalance', params:[address,'latest'] })
      });
      const data = await res.json();
      if (data.result) {
        const native = parseInt(data.result, 16) / 1e18;
        const result = { native, tokens: {} };
        cacheSet('bsc_' + address, result, 30000);
        return result;
      }
    } catch (_) {}
  }
  return { native: 0, tokens: {} };
}

// ── BTC ───────────────────────────────────────────────────
export async function fetchBtcBalance(address) {
  const cached = cacheGet('btc_' + address);
  if (cached) return cached;
  try {
    const res = await fetch(`https://mempool.space/api/address/${address}`);
    const data = await res.json();
    const confirmed = (data.chain_stats?.funded_txo_sum || 0) - (data.chain_stats?.spent_txo_sum || 0);
    const unconfirmed = (data.mempool_stats?.funded_txo_sum || 0) - (data.mempool_stats?.spent_txo_sum || 0);
    const native = (confirmed + unconfirmed) / 1e8;
    cacheSet('btc_' + address, native, 30000);
    return native;
  } catch (e) { return 0; }
}

// ── SOL ───────────────────────────────────────────────────
export async function fetchSolAll(address) {
  const cached = cacheGet('sol_' + address);
  if (cached) return cached;
  try {
    const headers = { 'Content-Type': 'application/json' };
    const [balRes, tokRes] = await Promise.all([
      fetch(CFG.SOL_RPC, {
        method: 'POST', headers,
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getBalance', params:[address] })
      }),
      fetch(CFG.SOL_RPC, {
        method: 'POST', headers,
        body: JSON.stringify({ jsonrpc:'2.0', id:2, method:'getTokenAccountsByOwner', params:[address, { programId:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding:'jsonParsed' }] })
      })
    ]);
    const balData = await balRes.json();
    const tokData = await tokRes.json();
    const native = (balData.result?.value || 0) / 1e9;
    
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
    const tokens = {};
    for (const acc of (tokData.result?.value || [])) {
      const info = acc.account?.data?.parsed?.info;
      if (!info) continue;
      const mint = info.mint;
      const amt = parseFloat(info.tokenAmount?.uiAmountString || '0');
      if (mint === USDC_MINT) tokens['USDC'] = amt;
      if (mint === USDT_MINT) tokens['USDT'] = amt;
    }
    
    const result = { native, tokens };
    cacheSet('sol_' + address, result, 30000);
    return result;
  } catch (e) { return { native: 0, tokens: {} }; }
}

// ── TRX ───────────────────────────────────────────────────
export async function fetchTrxAll(address) {
  const cached = cacheGet('trx_' + address);
  if (cached) return cached;
  try {
    const headers = { 'Content-Type': 'application/json', 'TRON-PRO-API-KEY': CFG.TRX_API_KEY };
    const [accRes, tokRes] = await Promise.all([
      fetch(`${CFG.TRX_RPC}/v1/accounts/${address}`, { headers }),
      fetch(`${CFG.TRX_RPC}/v1/accounts/${address}/tokens?limit=200`, { headers })
    ]);
    const accData = await accRes.json();
    const tokData = await tokRes.json();
    
    const native = (accData.data?.[0]?.balance || 0) / 1e6;
    const tokens = {};
    
    const USDT_TRX = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    const USDC_TRX = 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8';
    
    for (const t of (tokData.data || [])) {
      if (t.tokenId === USDT_TRX) tokens['USDT'] = (t.balance || 0) / 1e6;
      if (t.tokenId === USDC_TRX) tokens['USDC'] = (t.balance || 0) / 1e6;
    }
    
    const result = { native, tokens };
    cacheSet('trx_' + address, result, 30000);
    return result;
  } catch (e) { return { native: 0, tokens: {} }; }
}

// ── TX HISTORY ────────────────────────────────────────────
export async function fetchEthHistory(address, limit = 10) {
  try {
    const res = await fetch(CFG.ETH_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
        params: [{ fromAddress: address, category: ['external', 'erc20'], maxCount: `0x${limit.toString(16)}`, order: 'desc', withMetadata: true, excludeZeroValue: true }]
      })
    });
    const data = await res.json();
    return (data.result?.transfers || []).map(t => ({
      hash: t.hash, chain: 'ETH',
      type: t.from?.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
      amount: t.value || 0, sym: t.asset || 'ETH',
      to: t.to, from: t.from, time: t.metadata?.blockTimestamp || '',
    }));
  } catch (e) { return []; }
}

export async function fetchBtcHistory(address, limit = 10) {
  try {
    const res = await fetch(`https://mempool.space/api/address/${address}/txs`);
    const txs = await res.json();
    return txs.slice(0, limit).map(tx => {
      const myIn = tx.vin.some(v => v.prevout?.scriptpubkey_address === address);
      const myOut = tx.vout.find(v => v.scriptpubkey_address === address);
      const type = myIn ? 'sent' : 'received';
      const amount = myOut ? myOut.value / 1e8 : 0;
      return { hash: tx.txid, chain: 'BTC', type, amount, sym: 'BTC', time: tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString() : '' };
    });
  } catch (e) { return []; }
}

export async function fetchSolHistory(address, limit = 10) {
  try {
    const sigRes = await fetch(CFG.SOL_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [address, { limit }] })
    });
    const sigData = await sigRes.json();
    return (sigData.result || []).map(s => ({
      hash: s.signature, chain: 'SOL', type: 'transfer', amount: 0, sym: 'SOL',
      time: s.blockTime ? new Date(s.blockTime * 1000).toISOString() : '',
    }));
  } catch (e) { return []; }
}

export async function fetchTrxHistory(address, limit = 10) {
  try {
    const res = await fetch(`${CFG.TRX_RPC}/v1/accounts/${address}/transactions?limit=${limit}&order_by=block_timestamp,desc`, {
      headers: { 'TRON-PRO-API-KEY': CFG.TRX_API_KEY }
    });
    const data = await res.json();
    return (data.data || []).map(tx => ({
      hash: tx.txID, chain: 'TRX', type: 'transfer', amount: 0, sym: 'TRX',
      time: tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : '',
    }));
  } catch (e) { return []; }
}

// ── CHANGENOW SWAP ────────────────────────────────────────
const CN_BASE = 'https://api.changenow.io/v1';

export async function cnGetExchangeAmount(from, to, amount) {
  try {
    const fromCur = cnCurrency(from);
    const toCur = cnCurrency(to);
    const res = await fetch(`${CN_BASE}/exchange-amount/${amount}/${fromCur}_${toCur}/?api_key=${CFG.CN_KEY}`);
    const data = await res.json();
    if (data.error) return null;
    return { estimatedAmount: data.estimatedAmount, minAmount: data.minAmount || 0 };
  } catch (e) { return null; }
}

export async function cnCreateExchange(from, to, amount, toAddress) {
  try {
    const fromCur = cnCurrency(from);
    const toCur = cnCurrency(to);
    const fromNet = cnNetwork(from);
    const toNet = cnNetwork(to);
    const res = await fetch(`${CN_BASE}/transactions/${CFG.CN_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromCur, to: toCur, amount, address: toAddress, fromNetwork: fromNet, toNetwork: toNet })
    });
    const data = await res.json();
    if (data.error) return null;
    return { id: data.id, payinAddress: data.payinAddress, amount: data.amount };
  } catch (e) { return null; }
}

function cnCurrency(sym) {
  const map = { ETH:'eth', BTC:'btc', SOL:'sol', BNB:'bnb', TRX:'trx', USDC:'usdc', USDT:'usdt' };
  const base = sym.split('_')[0];
  return map[base] || base.toLowerCase();
}
function cnNetwork(sym) {
  const net = sym.includes('_') ? sym.split('_')[1] : sym;
  const map = { ETH:'eth', BTC:'btc', SOL:'sol', BSC:'bsc', TRX:'trx', BNB:'bsc', USDC:'', USDT:'' };
  return map[net] || net.toLowerCase();
}

// ── SUPABASE USERNAME ─────────────────────────────────────
const SB_HEADERS = {
  'apikey': CFG.SUPABASE_ANON,
  'Authorization': `Bearer ${CFG.SUPABASE_ANON}`,
  'Content-Type': 'application/json',
};

export async function loadUserByWallet(addresses) {
  try {
    // Try ETH address lookup
    const addr = addresses?.ETH?.toLowerCase();
    if (!addr) return null;
    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/users?eth_address=eq.${addr}&select=*`,
      { headers: SB_HEADERS }
    );
    const data = await res.json();
    return data?.[0] || null;
  } catch (e) { return null; }
}

export async function checkUsernameAvailable(username) {
  try {
    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username.toLowerCase())}&select=username`,
      { headers: SB_HEADERS }
    );
    const data = await res.json();
    return data.length === 0;
  } catch (e) { return true; }
}

export async function saveUsername(username, addresses) {
  try {
    const row = {
      username: username.toLowerCase(),
      eth_address: addresses.ETH?.toLowerCase(),
      btc_address: addresses.BTC,
      sol_address: addresses.SOL,
      trx_address: addresses.TRX,
      bsc_address: addresses.BSC?.toLowerCase(),
    };
    const res = await fetch(`${CFG.SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(row)
    });
    return res.ok;
  } catch (e) { return false; }
}

export async function lookupUsername(username) {
  try {
    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username.toLowerCase())}&select=*`,
      { headers: SB_HEADERS }
    );
    const data = await res.json();
    return data?.[0] || null;
  } catch (e) { return null; }
}
