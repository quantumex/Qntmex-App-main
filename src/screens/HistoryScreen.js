// QNTMEX Wallet - History Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { ScreenHeader, Spinner } from '../components/shared';
import { COLORS, CHAINS } from '../config';
import { useWallet } from '../hooks/useWalletStore';
import { fetchEthHistory, fetchBtcHistory, fetchSolHistory, fetchTrxHistory } from '../api';

export default function HistoryScreen({ onBack }) {
  const { state } = useWallet();
  const { wallet } = state;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChain, setActiveChain] = useState('ALL');

  const chainOrder = ['ALL', 'ETH', 'BTC', 'SOL', 'TRX'];
  const chainColor = { ETH:'#627EEA', BTC:'#F7931A', SOL:'#9945FF', TRX:'#EB0029' };

  useEffect(() => {
    if (wallet?.addrs) fetchAll();
  }, [wallet]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eth, btc, sol, trx] = await Promise.all([
        fetchEthHistory(wallet.addrs.ETH),
        fetchBtcHistory(wallet.addrs.BTC),
        fetchSolHistory(wallet.addrs.SOL),
        fetchTrxHistory(wallet.addrs.TRX),
      ]);
      const all = [...eth, ...btc, ...sol, ...trx].sort((a, b) => {
        const ta = new Date(a.time || 0).getTime();
        const tb = new Date(b.time || 0).getTime();
        return tb - ta;
      });
      setHistory(all);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeChain === 'ALL' ? history : history.filter(t => t.chain === activeChain);

  const openExplorer = (tx) => {
    const explorers = {
      ETH: `https://etherscan.io/tx/${tx.hash}`,
      BTC: `https://mempool.space/tx/${tx.hash}`,
      SOL: `https://solscan.io/tx/${tx.hash}`,
      TRX: `https://tronscan.org/#/transaction/${tx.hash}`,
    };
    const url = explorers[tx.chain];
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="History" onBack={onBack} />

      {/* Chain filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chainScroll} contentContainerStyle={s.chainContent}>
        {chainOrder.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.chainTab, c === activeChain && { borderColor: (chainColor[c] || COLORS.gold) + '55', backgroundColor: (chainColor[c] || COLORS.gold) + '15' }]}
            onPress={() => setActiveChain(c)}
          >
            <Text style={[s.chainTabLabel, c === activeChain && { color: chainColor[c] || COLORS.gold }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {loading ? (
          <View style={s.loadingView}><Spinner /><Text style={s.loadingText}>Loading history…</Text></View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyView}>
            <Text style={s.emptyIcon}>⊟</Text>
            <Text style={s.emptyTitle}>No transactions yet</Text>
            <Text style={s.emptySub}>Transactions will appear here once you start using your wallet.</Text>
          </View>
        ) : (
          filtered.map((tx, i) => (
            <TouchableOpacity key={tx.hash + i} style={s.txRow} onPress={() => openExplorer(tx)} activeOpacity={0.7}>
              <View style={[s.txIco, tx.type === 'received' ? s.txRcv : tx.type === 'sent' ? s.txSnt : s.txSwp]}>
                <Text style={s.txIcoText}>
                  {tx.type === 'received' ? '↓' : tx.type === 'sent' ? '↑' : '⇄'}
                </Text>
              </View>
              <View style={s.txInfo}>
                <Text style={s.txDesc}>
                  {tx.type === 'received' ? 'Received' : tx.type === 'sent' ? 'Sent' : 'Swap'} {tx.sym || tx.chain}
                </Text>
                <Text style={s.txWhen}>{formatTime(tx.time)}</Text>
              </View>
              <View style={s.txRight}>
                <Text style={[s.txNum, tx.type === 'received' ? s.txUp : s.txDn]}>
                  {tx.type === 'received' ? '+' : '-'}{tx.amount?.toFixed?.(6) || '—'} {tx.sym}
                </Text>
                <Text style={s.txHash}>{tx.chain} · {tx.hash?.slice(0, 8)}…</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(iso) {
  if (!iso) return 'Pending';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  } catch { return 'Unknown'; }
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:COLORS.bg },
  chainScroll: { flexShrink:0 },
  chainContent:{ paddingHorizontal:16, paddingVertical:8, gap:6 },
  chainTab:    { paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border, marginRight:6 },
  chainTabLabel:{ fontSize:11, fontWeight:'700', letterSpacing:0.8, color:COLORS.muted },
  scroll:      { flex:1 },
  content:     { paddingHorizontal:10, paddingBottom:20 },
  loadingView: { alignItems:'center', paddingTop:60, gap:12 },
  loadingText: { fontSize:14, color:COLORS.muted },
  emptyView:   { alignItems:'center', paddingTop:60, paddingHorizontal:32, gap:12 },
  emptyIcon:   { fontSize:48, opacity:0.3 },
  emptyTitle:  { fontSize:16, fontWeight:'700', color:COLORS.text2 },
  emptySub:    { fontSize:13, color:COLORS.muted, textAlign:'center', lineHeight:20 },
  txRow:       { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:8, paddingVertical:12, borderRadius:12 },
  txIco:       { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  txRcv:       { backgroundColor:'rgba(34,200,132,0.14)' },
  txSnt:       { backgroundColor:'rgba(224,92,92,0.14)' },
  txSwp:       { backgroundColor:'rgba(201,168,76,0.10)' },
  txIcoText:   { fontSize:16, fontWeight:'700' },
  txInfo:      { flex:1 },
  txDesc:      { fontSize:13, fontWeight:'600', color:COLORS.text, fontFamily:'System' },
  txWhen:      { fontSize:11, color:COLORS.muted, marginTop:2 },
  txRight:     { alignItems:'flex-end' },
  txNum:       { fontSize:13, fontWeight:'700', fontFamily:'System' },
  txUp:        { color:COLORS.green },
  txDn:        { color:COLORS.red },
  txHash:      { fontSize:10, color:COLORS.dim, marginTop:2 },
});
