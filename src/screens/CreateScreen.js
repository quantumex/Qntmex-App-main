// QNTMEX Wallet - Create Wallet Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import * as bip39 from 'bip39';
import { ScreenHeader, GoldButton, GhostButton, Spinner } from '../components/shared';
import { COLORS } from '../config';
import { deriveAllAddresses } from '../crypto';

export default function CreateScreen({ onNext, onBack }) {
  const [mnemonic, setMnemonic] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    // Generate mnemonic on mount
    const m = bip39.generateMnemonic(128); // 12 words
    setMnemonic(m);
  }, []);

  const words = mnemonic.split(' ');

  const handleContinue = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    try {
      const { addrs, privs } = await deriveAllAddresses(mnemonic);
      const w = {
        mnemonic,
        addrs,
        privKeys: { ETH: privs.ETH, BTC: privs.BTC, TRX: privs.TRX, BSC: privs.BSC, SOL_seed: Array.from(privs.SOL) }
      };
      onNext(w);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="New Wallet" onBack={onBack} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.warningCard}>
          <Text style={s.warningIcon}>⚠️</Text>
          <Text style={s.warningTitle}>WRITE THESE 12 WORDS DOWN</Text>
          <Text style={s.warningText}>
            Your seed phrase is the ONLY way to recover your wallet. Never share it with anyone. Store it offline in a safe place.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.seedGrid, !revealed && s.blurred]}
          onPress={() => setRevealed(true)}
          activeOpacity={0.9}
        >
          {!revealed ? (
            <View style={s.revealOverlay}>
              <Text style={s.revealIcon}>👁</Text>
              <Text style={s.revealText}>TAP TO REVEAL SEED PHRASE</Text>
            </View>
          ) : (
            words.map((w, i) => (
              <View key={i} style={s.wordChip}>
                <Text style={s.wordNum}>{i + 1}</Text>
                <Text style={s.wordVal}>{w}</Text>
              </View>
            ))
          )}
        </TouchableOpacity>

        {revealed && (
          <TouchableOpacity
            style={[s.confirmRow, confirmed && s.confirmChecked]}
            onPress={() => setConfirmed(c => !c)}
          >
            <View style={[s.checkbox, confirmed && s.checkboxChecked]}>
              {confirmed && <Text style={s.check}>✓</Text>}
            </View>
            <Text style={s.confirmText}>
              I have written down my seed phrase and understand I am responsible for its safekeeping.
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        {loading ? (
          <View style={s.loadingRow}><Spinner /><Text style={s.loadingText}>Deriving addresses…</Text></View>
        ) : (
          <GoldButton
            label={confirmed ? "SET PIN →" : "I'VE WRITTEN IT DOWN"}
            onPress={handleContinue}
            disabled={!revealed}
            style={{ marginHorizontal:16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:COLORS.bg },
  scroll:         { flex:1 },
  content:        { padding:16, paddingBottom:20 },
  warningCard:    { backgroundColor:'rgba(201,168,76,0.08)', borderWidth:1, borderColor:'rgba(201,168,76,0.18)', borderRadius:18, padding:18, marginBottom:20, alignItems:'center' },
  warningIcon:    { fontSize:28, marginBottom:8 },
  warningTitle:   { fontSize:12, fontWeight:'800', letterSpacing:2, color:COLORS.gold3, textTransform:'uppercase', marginBottom:8 },
  warningText:    { fontSize:13, color:COLORS.text2, textAlign:'center', lineHeight:20 },
  seedGrid:       { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:20, minHeight:180 },
  blurred:        { alignItems:'center', justifyContent:'center', backgroundColor:COLORS.surface, borderRadius:18, borderWidth:1, borderColor:COLORS.border2, padding:20 },
  revealOverlay:  { alignItems:'center', gap:12, paddingVertical:20 },
  revealIcon:     { fontSize:32 },
  revealText:     { fontSize:13, fontWeight:'700', letterSpacing:1.5, color:COLORS.muted, textTransform:'uppercase' },
  wordChip:       { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2, borderRadius:12, paddingHorizontal:12, paddingVertical:8, minWidth:100 },
  wordNum:        { fontSize:10, fontWeight:'600', color:COLORS.muted, width:16, textAlign:'right' },
  wordVal:        { fontSize:14, fontWeight:'700', color:COLORS.text, fontFamily:'System' },
  confirmRow:     { flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:COLORS.surface, borderRadius:14, padding:16, borderWidth:1, borderColor:COLORS.border2 },
  confirmChecked: { borderColor:'rgba(201,168,76,0.3)', backgroundColor:'rgba(201,168,76,0.05)' },
  checkbox:       { width:22, height:22, borderRadius:6, borderWidth:1.5, borderColor:COLORS.border2, alignItems:'center', justifyContent:'center', marginTop:1, flexShrink:0 },
  checkboxChecked:{ backgroundColor:COLORS.gold, borderColor:COLORS.gold },
  check:          { fontSize:13, fontWeight:'800', color:'#040302' },
  confirmText:    { flex:1, fontSize:13, color:COLORS.text2, lineHeight:20 },
  footer:         { padding:16, paddingBottom:32 },
  loadingRow:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, height:54 },
  loadingText:    { fontSize:14, color:COLORS.muted },
});
