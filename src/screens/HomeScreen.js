// QNTMEX Wallet - Home / Dashboard Screen
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CHAINS } from '../config';
import { useWallet, computePortfolioValue } from '../hooks/useWalletStore';
import { Spinner } from '../components/shared';

const CHAIN_ORDER = ['ETH', 'BTC', 'SOL', 'BSC', 'TRX'];

export default function HomeScreen({ onSend, onReceive, onSwap, onOpenToken }) {
  const { state, refreshBalances } = useWallet();
  const { wallet, balances, prices, balLoading } = state;

  const total = computePortfolioValue(balances, prices);

  const onRefresh = useCallback(() => {
    if (wallet?.addrs) refreshBalances(wallet.addrs);
  }, [wallet, refreshBalances]);

  // Build token list
  const tokens = buildTokenList(balances, prices);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={balLoading}
          onRefresh={onRefresh}
          tintColor={COLORS.gold}
          colors={[COLORS.gold]}
        />
      }
    >
      {/* Hero */}
      <LinearGradient
        colors={[COLORS.bg1, COLORS.bg]}
        style={s.hero}
      >
        <Text style={s.heroEye}>TOTAL PORTFOLIO</Text>
        <Text style={s.heroValue}>
          <Text style={s.heroSym}>$</Text>
          {total.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
        </Text>
        {balLoading && (
          <View style={s.loadRow}><Spinner size="small" /><Text style={s.loadText}>Refreshing…</Text></View>
        )}
      </LinearGradient>

      {/* Action buttons */}
      <View style={s.actRow}>
        <TouchableOpacity style={s.actGold} onPress={onSend}>
          <Text style={s.actGoldLabel}>↑ SEND</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actGhost} onPress={onReceive}>
          <Text style={s.actGhostLabel}>↓ RECEIVE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actGhost} onPress={onSwap}>
          <Text style={s.actGhostLabel}>⇄ SWAP</Text>
        </TouchableOpacity>
      </View>

      {/* Chain filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chainScroll} contentContainerStyle={s.chainScrollContent}>
        {CHAIN_ORDER.map(chain => (
          <View key={chain} style={s.chainTab}>
            <View style={[s.chainPip, { backgroundColor: CHAINS[chain].pip }]} />
            <Text style={s.chainTabLabel}>{chain}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Token list */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>ASSETS</Text>
        </View>
        {tokens.map((tok, i) => (
          <TokenRow key={tok.key} tok={tok} onPress={() => onOpenToken && onOpenToken(tok)} />
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function TokenRow({ tok, onPress }) {
  const chainColor = { ETH:'#627EEA', BTC:'#F7931A', SOL:'#9945FF', BSC:'#F3BA2F', TRX:'#EB0029', USDT:'#26A17B', USDC:'#2775CA' };
  const col = chainColor[tok.key] || COLORS.muted;

  return (
    <TouchableOpacity style={s.tokRow} onPress={onPress} activeOpacity={0.7}>
      {/* Icon */}
      <View style={[s.tokIco, { backgroundColor: col + '22' }]}>
        <Text style={[s.tokIcoText, { color: col }]}>{tok.ico}</Text>
        {tok.chainKey && tok.chainKey !== tok.key && (
          <View style={[s.tokBadge, { backgroundColor: chainColor[tok.chainKey] || COLORS.muted }]}>
            <Text style={s.tokBadgeText}>{tok.chainKey[0]}</Text>
          </View>
        )}
      </View>
      {/* Info */}
      <View style={s.tokInfo}>
        <Text style={s.tokName}>{tok.name}</Text>
        <Text style={s.tokNet}>{tok.net}</Text>
      </View>
      {/* Values */}
      <View style={s.tokRight}>
        <Text style={s.tokVal}>${tok.usd.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}</Text>
        <Text style={s.tokAmt}>{tok.amount.toFixed(tok.decimals)} {tok.sym}</Text>
        {tok.change !== 0 && (
          <Text style={[s.tokChange, tok.change > 0 ? s.up : s.dn]}>
            {tok.change > 0 ? '+' : ''}{tok.change.toFixed(2)}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function buildTokenList(balances, prices) {
  const p = prices || {};
  const list = [];

  const add = (key, name, sym, ico, net, chainKey, amount, priceKey, decimals = 6) => {
    const px = p[priceKey] || { usd: (priceKey === 'USDC' || priceKey === 'USDT') ? 1 : 0, change: 0 };
    const usd = amount * px.usd;
    if (usd > 0.01 || amount > 0) {
      list.push({ key, name, sym, ico, net, chainKey, amount, usd, change: px.change || 0, decimals });
    }
  };

  add('ETH', 'Ethereum', 'ETH', 'Ξ', 'Ethereum', 'ETH', balances.ETH?.native || 0, 'ETH', 6);
  add('BTC', 'Bitcoin', 'BTC', '₿', 'Bitcoin', 'BTC', typeof balances.BTC === 'number' ? balances.BTC : 0, 'BTC', 8);
  add('SOL', 'Solana', 'SOL', '◎', 'Solana', 'SOL', balances.SOL?.native || 0, 'SOL', 6);
  add('BNB', 'BNB Chain', 'BNB', 'BNB', 'BNB Chain', 'BSC', balances.BSC?.native || 0, 'BNB', 6);
  add('TRX', 'Tron', 'TRX', 'TRX', 'Tron', 'TRX', balances.TRX?.native || 0, 'TRX', 6);
  // Stablecoins
  const ethUsdt = balances.ETH?.tokens?.USDT || 0;
  const ethUsdc = balances.ETH?.tokens?.USDC || 0;
  const solUsdt = balances.SOL?.tokens?.USDT || 0;
  const solUsdc = balances.SOL?.tokens?.USDC || 0;
  const trxUsdt = balances.TRX?.tokens?.USDT || 0;
  if (ethUsdt > 0) add('USDT_ETH', 'Tether USD', 'USDT', 'T', 'ERC-20', 'ETH', ethUsdt, 'USDT', 2);
  if (ethUsdc > 0) add('USDC_ETH', 'USD Coin', 'USDC', 'U', 'ERC-20', 'ETH', ethUsdc, 'USDC', 2);
  if (solUsdt > 0) add('USDT_SOL', 'Tether USD', 'USDT', 'T', 'SPL', 'SOL', solUsdt, 'USDT', 2);
  if (solUsdc > 0) add('USDC_SOL', 'USD Coin', 'USDC', 'U', 'SPL', 'SOL', solUsdc, 'USDC', 2);
  if (trxUsdt > 0) add('USDT_TRX', 'Tether USD', 'USDT', 'T', 'TRC-20', 'TRX', trxUsdt, 'USDT', 2);

  list.sort((a, b) => b.usd - a.usd);
  return list;
}

const s = StyleSheet.create({
  scroll:            { flex:1, backgroundColor:COLORS.bg },
  content:           { paddingBottom:16 },
  hero:              { paddingHorizontal:20, paddingTop:28, paddingBottom:24, position:'relative', overflow:'hidden' },
  heroEye:           { fontSize:10, fontWeight:'600', letterSpacing:2.5, color:COLORS.muted, textTransform:'uppercase', marginBottom:10, fontFamily:'System' },
  heroValue:         { fontSize:44, fontWeight:'800', color:COLORS.bright, letterSpacing:-1, fontFamily:'System' },
  heroSym:           { fontSize:28, fontWeight:'700', color:COLORS.text2 },
  loadRow:           { flexDirection:'row', alignItems:'center', gap:8, marginTop:8 },
  loadText:          { fontSize:12, color:COLORS.muted },
  actRow:            { flexDirection:'row', gap:8, paddingHorizontal:16, paddingTop:16 },
  actGold:           { flex:1, height:46, borderRadius:18, backgroundColor:COLORS.gold2, alignItems:'center', justifyContent:'center' },
  actGoldLabel:      { fontSize:13, fontWeight:'700', letterSpacing:0.8, color:'#040302', textTransform:'uppercase' },
  actGhost:          { flex:1, height:46, borderRadius:18, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2, alignItems:'center', justifyContent:'center' },
  actGhostLabel:     { fontSize:13, fontWeight:'600', color:COLORS.text2 },
  chainScroll:       { marginTop:16 },
  chainScrollContent:{ paddingHorizontal:16, gap:6 },
  chainTab:          { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border, marginRight:6 },
  chainPip:          { width:6, height:6, borderRadius:3 },
  chainTabLabel:     { fontSize:11, fontWeight:'700', letterSpacing:0.8, color:COLORS.muted, textTransform:'uppercase' },
  section:           { marginTop:4 },
  sectionHeader:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingTop:20, paddingBottom:8 },
  sectionTitle:      { fontSize:11, fontWeight:'700', letterSpacing:2.5, textTransform:'uppercase', color:COLORS.muted },
  tokRow:            { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:18, paddingVertical:12 },
  tokIco:            { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' },
  tokIcoText:        { fontSize:16, fontWeight:'800' },
  tokBadge:          { position:'absolute', bottom:-2, right:-2, width:16, height:16, borderRadius:8, borderWidth:2, borderColor:COLORS.bg, alignItems:'center', justifyContent:'center' },
  tokBadgeText:      { fontSize:7, fontWeight:'700', color:'#000' },
  tokInfo:           { flex:1 },
  tokName:           { fontSize:14, fontWeight:'700', color:COLORS.text, fontFamily:'System' },
  tokNet:            { fontSize:11, color:COLORS.muted, marginTop:2 },
  tokRight:          { alignItems:'flex-end' },
  tokVal:            { fontSize:13, fontWeight:'700', color:COLORS.text, fontFamily:'System' },
  tokAmt:            { fontSize:13, color:COLORS.muted, fontFamily:'System', marginTop:2 },
  tokChange:         { fontSize:12, fontWeight:'700', marginTop:2 },
  up:                { color:COLORS.green },
  dn:                { color:COLORS.red },
});
