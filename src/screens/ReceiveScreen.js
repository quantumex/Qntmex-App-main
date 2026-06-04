// QNTMEX Wallet - Receive Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Share
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, Spinner } from '../components/shared';
import { COLORS, CHAINS } from '../config';
import { useWallet } from '../hooks/useWalletStore';

const CHAIN_ORDER = ['ETH', 'BTC', 'SOL', 'BSC', 'TRX'];

export default function ReceiveScreen({ onBack }) {
  const { state, showToast } = useWallet();
  const { wallet } = state;
  const [chain, setChain] = useState('ETH');

  const addr = wallet?.addrs?.[chain] || '';

  const copyAddr = async () => {
    await Clipboard.setStringAsync(addr);
    showToast('✓ Address copied to clipboard');
  };

  const shareAddr = async () => {
    await Share.share({ message: addr, title: `My ${chain} Address` });
  };

  const chainColor = {
    ETH:'#627EEA', BTC:'#F7931A', SOL:'#9945FF', BSC:'#F3BA2F', TRX:'#EB0029'
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Receive" onBack={onBack} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Chain tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chainScroll} contentContainerStyle={s.chainContent}>
          {CHAIN_ORDER.map(c => (
            <TouchableOpacity
              key={c}
              style={[s.chainTab, c === chain && { borderColor: chainColor[c] + '55', backgroundColor: chainColor[c] + '15' }]}
              onPress={() => setChain(c)}
            >
              <View style={[s.chainPip, { backgroundColor: chainColor[c] }]} />
              <Text style={[s.chainTabLabel, c === chain && { color: chainColor[c] }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* QR Code */}
        <View style={s.qrContainer}>
          {addr ? (
            <>
              <View style={s.qrBox}>
                <View style={s.qrBg}>
                  <QRCode
                    value={addr}
                    size={200}
                    backgroundColor="transparent"
                    color={COLORS.text}
                    quietZone={12}
                  />
                </View>
                <View style={[s.chainBadge, { borderColor: chainColor[chain] + '55', backgroundColor: chainColor[chain] + '15' }]}>
                  <View style={[s.chainPip, { backgroundColor: chainColor[chain] }]} />
                  <Text style={[s.chainBadgeText, { color: chainColor[chain] }]}>{CHAINS[chain].n}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={s.qrBox}><Spinner /></View>
          )}
        </View>

        {/* Address display */}
        <View style={s.addrCard}>
          <Text style={s.addrLabel}>{chain} ADDRESS</Text>
          <Text style={s.addrText} selectable>{addr}</Text>
        </View>

        {/* Actions */}
        <View style={s.actRow}>
          <TouchableOpacity style={s.actBtn} onPress={copyAddr} activeOpacity={0.7}>
            <Text style={s.actIco}>⊕</Text>
            <Text style={s.actLabel}>COPY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actBtn} onPress={shareAddr} activeOpacity={0.7}>
            <Text style={s.actIco}>↑</Text>
            <Text style={s.actLabel}>SHARE</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={s.warnCard}>
          <Text style={s.warnText}>
            Only send <Text style={{ color: chainColor[chain], fontWeight:'700' }}>{chain}</Text> and compatible tokens to this address. Sending other assets may result in permanent loss.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bg },
  scroll:       { flex:1 },
  content:      { alignItems:'center', paddingBottom:24 },
  chainScroll:  { width:'100%', marginBottom:8 },
  chainContent: { paddingHorizontal:16, gap:6 },
  chainTab:     { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border, marginRight:6 },
  chainPip:     { width:6, height:6, borderRadius:3 },
  chainTabLabel:{ fontSize:11, fontWeight:'700', letterSpacing:0.8, color:COLORS.muted, textTransform:'uppercase' },
  qrContainer:  { width:'100%', alignItems:'center', paddingVertical:24 },
  qrBox:        { alignItems:'center', gap:14 },
  qrBg:         { padding:20, backgroundColor:COLORS.surface, borderRadius:24, borderWidth:1, borderColor:COLORS.border2 },
  chainBadge:   { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:6, borderRadius:20, borderWidth:1 },
  chainBadgeText:{ fontSize:12, fontWeight:'700', letterSpacing:1 },
  addrCard:     { width:'calc(100% - 32px)', marginHorizontal:16, backgroundColor:COLORS.surface, borderRadius:16, padding:16, borderWidth:1, borderColor:COLORS.border2, alignItems:'center' },
  addrLabel:    { fontSize:10, fontWeight:'700', letterSpacing:2, color:COLORS.muted, textTransform:'uppercase', marginBottom:10 },
  addrText:     { fontSize:12, color:COLORS.text2, fontFamily:'System', letterSpacing:0.5, textAlign:'center', lineHeight:20 },
  actRow:       { flexDirection:'row', gap:12, marginTop:16, marginHorizontal:16 },
  actBtn:       { flex:1, height:50, backgroundColor:COLORS.surface, borderRadius:16, borderWidth:1, borderColor:COLORS.border2, alignItems:'center', justifyContent:'center', flexDirection:'row', gap:8 },
  actIco:       { fontSize:18, color:COLORS.gold },
  actLabel:     { fontSize:12, fontWeight:'700', letterSpacing:1.5, color:COLORS.text2, textTransform:'uppercase' },
  warnCard:     { marginHorizontal:16, marginTop:16, backgroundColor:'rgba(201,168,76,0.05)', borderRadius:14, padding:14, borderWidth:1, borderColor:'rgba(201,168,76,0.15)' },
  warnText:     { fontSize:12, color:COLORS.muted, textAlign:'center', lineHeight:20 },
});
