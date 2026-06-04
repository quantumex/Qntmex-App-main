// QNTMEX Wallet - Welcome Screen
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { GoldButton, GhostButton } from '../components/shared';
import { COLORS } from '../config';

export default function WelcomeScreen({ onCreate, onImport }) {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.glow} />

        {/* Brand */}
        <View style={s.brand}>
          <Text style={s.shield}>🛡</Text>
          <Text style={s.wordmark}>QNTMEX</Text>
          <Text style={s.sub}>NON-CUSTODIAL WALLET</Text>
          <Text style={s.tagline}>Your crypto. Your keys. Your wallet.</Text>
        </View>

        {/* Chain pills */}
        <View style={s.chainRow}>
          {['ETH','BTC','SOL','BNB','TRX'].map((c, i) => (
            <View key={c} style={[s.chainPill, { backgroundColor: chainBg[c] }]}>
              <Text style={[s.chainText, { color: chainColor[c] }]}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={s.features}>
          {FEATURES.map(f => (
            <View key={f.icon} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <View style={{ flex:1 }}>
                <Text style={s.featureName}>{f.name}</Text>
                <Text style={s.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <GoldButton label="CREATE NEW WALLET" onPress={onCreate} style={{ marginBottom:10 }} />
          <GhostButton label="IMPORT EXISTING WALLET" onPress={onImport} />
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => Linking.openURL('https://qntmex.com')}>
          <Text style={s.footer}>qntmex.com · Non-Custodial · Open Source Keys</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const chainColor = { ETH:'#627EEA', BTC:'#F7931A', SOL:'#9945FF', BNB:'#F3BA2F', TRX:'#EB0029' };
const chainBg = { ETH:'rgba(98,126,234,0.12)', BTC:'rgba(247,147,26,0.12)', SOL:'rgba(153,69,255,0.12)', BNB:'rgba(243,186,47,0.12)', TRX:'rgba(235,0,41,0.12)' };
const FEATURES = [
  { icon:'🔑', name:'Self-Custody', sub:'You control your private keys' },
  { icon:'⇄', name:'Multi-Chain Swap', sub:'ETH · BTC · SOL · BNB · TRX' },
  { icon:'👤', name:'Username System', sub:'Send by @username across all chains' },
  { icon:'🔒', name:'PIN Protection', sub:'AES-256 encrypted local storage' },
];

const s = StyleSheet.create({
  safe:      { flex:1, backgroundColor:COLORS.void },
  container: { flex:1, alignItems:'center', paddingHorizontal:28, paddingBottom:24, paddingTop:20 },
  glow:      { position:'absolute', top:-60, left:'50%', marginLeft:-160, width:320, height:320, borderRadius:160, backgroundColor:'rgba(201,168,76,0.07)' },
  brand:     { alignItems:'center', marginBottom:28 },
  shield:    { fontSize:52, marginBottom:10 },
  wordmark:  { fontSize:28, fontWeight:'800', letterSpacing:6, color:COLORS.gold3, textTransform:'uppercase', fontFamily:'System' },
  sub:       { fontSize:10, fontWeight:'500', letterSpacing:2.5, color:COLORS.muted, textTransform:'uppercase', marginTop:4 },
  tagline:   { fontSize:15, color:COLORS.text2, marginTop:12, textAlign:'center', lineHeight:22, fontStyle:'italic' },
  chainRow:  { flexDirection:'row', gap:6, flexWrap:'wrap', justifyContent:'center', marginBottom:20 },
  chainPill: { paddingHorizontal:12, paddingVertical:5, borderRadius:20 },
  chainText: { fontSize:11, fontWeight:'700', letterSpacing:1 },
  features:  { width:'100%', marginBottom:24 },
  featureRow:{ flexDirection:'row', alignItems:'center', gap:14, paddingVertical:10 },
  featureIcon:{ fontSize:22, width:32, textAlign:'center' },
  featureName:{ fontSize:14, fontWeight:'700', color:COLORS.text, fontFamily:'System' },
  featureSub: { fontSize:12, color:COLORS.muted, marginTop:2 },
  actions:   { width:'100%', marginBottom:20 },
  footer:    { fontSize:11, color:COLORS.muted, textAlign:'center', letterSpacing:0.5 },
});
