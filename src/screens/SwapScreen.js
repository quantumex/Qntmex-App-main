// QNTMEX Wallet - Swap Screen
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, FlatList, Image
} from 'react-native';
import { ScreenHeader, GoldButton, WalletInput, Spinner } from '../components/shared';
import { COLORS, SWAP_TOKENS, CFG, SWAP_FEE_PCT } from '../config';
import { cnGetExchangeAmount, cnCreateExchange } from '../api';
import { useWallet } from '../hooks/useWalletStore';

export default function SwapScreen({ onBack }) {
  const { state, showToast } = useWallet();
  const { wallet, balances, prices } = state;

  const [fromToken, setFromToken] = useState(SWAP_TOKENS[0]); // ETH
  const [toToken, setToToken] = useState(SWAP_TOKENS[1]);   // BTC
  const [amount, setAmount] = useState('');
  const [estimated, setEstimated] = useState(null);
  const [minAmount, setMinAmount] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [swapResult, setSwapResult] = useState(null);

  const getQuote = useCallback(async (amt, from, to) => {
    if (!amt || parseFloat(amt) <= 0) { setEstimated(null); return; }
    setQuoting(true);
    const result = await cnGetExchangeAmount(from.key, to.key, parseFloat(amt));
    setQuoting(false);
    if (result) {
      setEstimated(result.estimatedAmount);
      setMinAmount(result.minAmount);
    } else {
      setEstimated(null);
    }
  }, []);

  const handleAmountChange = (v) => {
    setAmount(v);
    if (v && parseFloat(v) > 0) {
      clearTimeout(window._swapDebounce);
      setTimeout(() => getQuote(v, fromToken, toToken), 600);
    } else {
      setEstimated(null);
    }
  };

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setEstimated(null);
  };

  const handleSwap = async () => {
    if (!amount || !estimated) { showToast('Enter amount to get a quote first'); return; }
    const toAddr = wallet?.addrs?.[toToken.chainKey];
    if (!toAddr) { showToast('No address for ' + toToken.chainKey); return; }

    // Apply 0.3% swap fee
    const sendAmount = parseFloat(amount) * (1 - SWAP_FEE_PCT);

    Alert.alert(
      'Confirm Swap',
      `Swap ${amount} ${fromToken.sym} → ${estimated} ${toToken.sym}\n\nDestination: ${toAddr.slice(0,14)}…\n\nPlatform fee: 0.3% of ${fromToken.sym} routed to treasury`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Swap', onPress: executeSwap },
      ]
    );
  };

  const executeSwap = async () => {
    setSwapping(true);
    try {
      const toAddr = wallet?.addrs?.[toToken.chainKey];
      const result = await cnCreateExchange(fromToken.key, toToken.key, parseFloat(amount), toAddr);
      if (result) {
        setSwapResult(result);
        showToast('✓ Swap created! Send funds to deposit address.');
      } else {
        showToast('Swap creation failed — try again');
      }
    } catch (e) {
      showToast('Swap error: ' + e.message);
    } finally {
      setSwapping(false);
    }
  };

  const fromPx = prices[fromToken.chainKey === 'BSC' ? 'BNB' : fromToken.chainKey] || { usd: 0 };
  const amountUsd = (parseFloat(amount) || 0) * fromPx.usd;

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Swap" onBack={onBack} />

      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {/* Powered by */}
        <View style={s.poweredBy}>
          <Text style={s.poweredText}>Powered by ChangeNow · Non-custodial swap</Text>
        </View>

        {/* From */}
        <View style={s.swapCard}>
          <Text style={s.swapCardLabel}>FROM</Text>
          <View style={s.swapRow}>
            <TouchableOpacity style={s.tokenPill} onPress={() => setShowFromPicker(true)}>
              <Text style={s.tokenSym}>{fromToken.sym}</Text>
              <Text style={s.tokenChain}>({fromToken.chainKey})</Text>
              <Text style={s.tokenArr}>▼</Text>
            </TouchableOpacity>
            <WalletInput
              placeholder="0.00"
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              style={s.swapInput}
            />
          </View>
          {amountUsd > 0 && (
            <Text style={s.swapUsd}>≈ ${amountUsd.toFixed(2)} USD</Text>
          )}
          {minAmount && (
            <Text style={s.minAmt}>Min: {minAmount} {fromToken.sym}</Text>
          )}
        </View>

        {/* Flip button */}
        <TouchableOpacity style={s.flipBtn} onPress={handleFlip}>
          <Text style={s.flipIco}>⇅</Text>
        </TouchableOpacity>

        {/* To */}
        <View style={s.swapCard}>
          <Text style={s.swapCardLabel}>TO</Text>
          <View style={s.swapRow}>
            <TouchableOpacity style={s.tokenPill} onPress={() => setShowToPicker(true)}>
              <Text style={s.tokenSym}>{toToken.sym}</Text>
              <Text style={s.tokenChain}>({toToken.chainKey})</Text>
              <Text style={s.tokenArr}>▼</Text>
            </TouchableOpacity>
            <View style={s.estimatedBox}>
              {quoting ? (
                <Spinner size="small" />
              ) : (
                <Text style={s.estimatedText}>
                  {estimated ? `≈ ${estimated}` : '—'}
                </Text>
              )}
            </View>
          </View>
          <Text style={s.receiveAddr}>
            Destination: {wallet?.addrs?.[toToken.chainKey]?.slice(0,16)}…
          </Text>
        </View>

        {/* Fee info */}
        <View style={s.feeCard}>
          <View style={s.feeRow}>
            <Text style={s.feeLbl}>Platform Fee</Text>
            <Text style={[s.feeVal, { color: COLORS.gold }]}>0.3%</Text>
          </View>
          <View style={s.feeRow}>
            <Text style={s.feeLbl}>Provider</Text>
            <Text style={s.feeVal}>ChangeNow</Text>
          </View>
          <View style={s.feeRow}>
            <Text style={s.feeLbl}>Type</Text>
            <Text style={s.feeVal}>Fixed rate · No KYC</Text>
          </View>
        </View>

        {/* Swap result */}
        {swapResult && (
          <View style={s.resultCard}>
            <Text style={s.resultTitle}>✓ SWAP CREATED</Text>
            <Text style={s.resultLabel}>Send {amount} {fromToken.sym} to:</Text>
            <Text style={s.resultAddr} selectable>{swapResult.payinAddress}</Text>
            <Text style={s.resultSub}>Swap ID: {swapResult.id}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        {swapping ? (
          <View style={s.loadRow}><Spinner /><Text style={s.loadText}>Creating swap…</Text></View>
        ) : (
          <GoldButton
            label={estimated ? `SWAP → ${estimated} ${toToken.sym}` : 'GET QUOTE'}
            onPress={estimated ? handleSwap : () => getQuote(amount, fromToken, toToken)}
            disabled={!amount || parseFloat(amount) <= 0}
            style={{ marginHorizontal: 16 }}
          />
        )}
      </View>

      {/* Token pickers */}
      <TokenPickerModal
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={(t) => { setFromToken(t); setShowFromPicker(false); setEstimated(null); }}
        exclude={toToken.key}
      />
      <TokenPickerModal
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={(t) => { setToToken(t); setShowToPicker(false); setEstimated(null); }}
        exclude={fromToken.key}
      />
    </SafeAreaView>
  );
}

function TokenPickerModal({ visible, onClose, onSelect, exclude }) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={m.overlay}>
        <TouchableOpacity style={m.backdrop} onPress={onClose} />
        <View style={m.sheet}>
          <View style={m.header}>
            <Text style={m.title}>SELECT TOKEN</Text>
            <TouchableOpacity onPress={onClose}><Text style={m.close}>✕</Text></TouchableOpacity>
          </View>
          <FlatList
            data={SWAP_TOKENS.filter(t => t.key !== exclude)}
            keyExtractor={t => t.key}
            renderItem={({ item }) => (
              <TouchableOpacity style={m.tokenRow} onPress={() => onSelect(item)}>
                <View style={[m.tokenIcon, { backgroundColor: item.color + '22' }]}>
                  <Text style={[m.tokenIcoText, { color: item.color }]}>{item.sym[0]}</Text>
                </View>
                <View style={m.tokenInfo}>
                  <Text style={m.tokenName}>{item.name}</Text>
                  <Text style={m.tokenSym}>{item.sym} · {item.chainKey}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:COLORS.bg },
  scroll:      { flex:1 },
  content:     { paddingBottom:20 },
  poweredBy:   { paddingHorizontal:16, paddingVertical:8 },
  poweredText: { fontSize:11, color:COLORS.muted, letterSpacing:0.5 },
  swapCard:    { marginHorizontal:16, marginVertical:6, backgroundColor:COLORS.surface, borderRadius:18, padding:16, borderWidth:1, borderColor:COLORS.border2 },
  swapCardLabel:{ fontSize:10, fontWeight:'700', letterSpacing:2, color:COLORS.muted, textTransform:'uppercase', marginBottom:10 },
  swapRow:     { flexDirection:'row', alignItems:'center', gap:10 },
  tokenPill:   { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:12, paddingVertical:8, backgroundColor:COLORS.lift, borderRadius:14, borderWidth:1, borderColor:COLORS.border2 },
  tokenSym:    { fontSize:15, fontWeight:'800', color:COLORS.text },
  tokenChain:  { fontSize:10, color:COLORS.muted, fontWeight:'600' },
  tokenArr:    { fontSize:10, color:COLORS.muted },
  swapInput:   { flex:1 },
  estimatedBox:{ flex:1, height:50, backgroundColor:COLORS.bg, borderRadius:14, alignItems:'flex-end', justifyContent:'center', paddingRight:12 },
  estimatedText:{ fontSize:20, fontWeight:'700', color:COLORS.gold2 },
  swapUsd:     { fontSize:12, color:COLORS.muted, marginTop:6 },
  minAmt:      { fontSize:11, color:COLORS.dim, marginTop:2 },
  receiveAddr: { fontSize:11, color:COLORS.muted, marginTop:8, letterSpacing:0.3 },
  flipBtn:     { alignSelf:'center', width:44, height:44, borderRadius:22, backgroundColor:COLORS.lift, borderWidth:1, borderColor:COLORS.border2, alignItems:'center', justifyContent:'center', marginVertical:4 },
  flipIco:     { fontSize:20, color:COLORS.gold2 },
  feeCard:     { marginHorizontal:16, marginTop:12, backgroundColor:COLORS.surface, borderRadius:14, padding:14, borderWidth:1, borderColor:COLORS.border },
  feeRow:      { flexDirection:'row', justifyContent:'space-between', paddingVertical:4 },
  feeLbl:      { fontSize:12, color:COLORS.muted },
  feeVal:      { fontSize:13, fontWeight:'700', color:COLORS.text2 },
  resultCard:  { marginHorizontal:16, marginTop:12, backgroundColor:'rgba(34,200,132,0.08)', borderRadius:14, padding:16, borderWidth:1, borderColor:'rgba(34,200,132,0.2)' },
  resultTitle: { fontSize:13, fontWeight:'800', color:COLORS.green, letterSpacing:1, marginBottom:10 },
  resultLabel: { fontSize:13, color:COLORS.text2, marginBottom:6 },
  resultAddr:  { fontSize:12, color:COLORS.text, fontFamily:'System', backgroundColor:COLORS.surface, borderRadius:8, padding:8, marginBottom:6 },
  resultSub:   { fontSize:11, color:COLORS.muted },
  footer:      { padding:16, paddingBottom:32 },
  loadRow:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, height:54 },
  loadText:    { fontSize:14, color:COLORS.muted },
});
const m = StyleSheet.create({
  overlay:    { flex:1, justifyContent:'flex-end' },
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor:COLORS.bg1, borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:40, maxHeight:'70%' },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:20, borderBottomWidth:1, borderBottomColor:COLORS.border },
  title:      { fontSize:14, fontWeight:'800', letterSpacing:2, color:COLORS.bright },
  close:      { fontSize:20, color:COLORS.muted, padding:4 },
  tokenRow:   { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:COLORS.border },
  tokenIcon:  { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  tokenIcoText:{ fontSize:16, fontWeight:'800' },
  tokenInfo:  { flex:1 },
  tokenName:  { fontSize:14, fontWeight:'700', color:COLORS.text },
  tokenSym:   { fontSize:12, color:COLORS.muted, marginTop:2 },
});
