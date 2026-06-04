// QNTMEX Wallet - Import Wallet Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import * as bip39 from 'bip39';
import { ScreenHeader, GoldButton, WalletInput, Spinner } from '../components/shared';
import { COLORS } from '../config';
import { deriveAllAddresses } from '../crypto';

export default function ImportScreen({ onNext, onBack }) {
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const words = phrase.trim().split(/\s+/).filter(Boolean);
  const valid = bip39.validateMnemonic(phrase.trim());

  const handleImport = async () => {
    if (!valid) {
      setError('Invalid seed phrase. Check word spelling and order.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const mnemonic = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
      const { addrs, privs } = await deriveAllAddresses(mnemonic);
      const wallet = {
        mnemonic,
        addrs,
        privKeys: { ETH: privs.ETH, BTC: privs.BTC, TRX: privs.TRX, BSC: privs.BSC, SOL_seed: Array.from(privs.SOL) }
      };
      onNext(wallet);
    } catch (e) {
      setError('Failed to derive wallet from this phrase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Import Wallet" onBack={onBack} />

      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <Text style={s.hint}>Enter your 12 or 24-word seed phrase to restore your wallet.</Text>

        {/* Word grid input */}
        <WalletInput
          label="SEED PHRASE"
          placeholder="word1 word2 word3 ... word12"
          value={phrase}
          onChangeText={(t) => { setPhrase(t); setError(''); }}
          multiline
        />

        {/* Word count indicator */}
        <View style={s.countRow}>
          {[...Array(12)].map((_, i) => (
            <View key={i} style={[s.dot, words.length > i && s.dotFilled]} />
          ))}
          <Text style={s.countText}>{words.length}/12</Text>
        </View>

        {/* Validation state */}
        {phrase.trim().length > 0 && (
          <View style={[s.statusBar, valid ? s.statusOk : s.statusErr]}>
            <Text style={[s.statusText, valid ? s.statusOkText : s.statusErrText]}>
              {valid ? '✓ Valid seed phrase' : (words.length < 12 ? `${words.length}/12 words entered` : '✗ Invalid phrase — check spelling')}
            </Text>
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <View style={s.infoCard}>
          <Text style={s.infoText}>🔒 Your phrase is processed locally and never leaves this device.</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        {loading ? (
          <View style={s.loadingRow}><Spinner /><Text style={s.loadingText}>Restoring wallet…</Text></View>
        ) : (
          <GoldButton
            label="RESTORE WALLET"
            onPress={handleImport}
            disabled={!valid}
            style={{ marginHorizontal: 16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:COLORS.bg },
  scroll:     { flex:1 },
  content:    { paddingTop:16, paddingBottom:20 },
  hint:       { fontSize:14, color:COLORS.text2, lineHeight:22, marginHorizontal:16, marginBottom:20 },
  countRow:   { flexDirection:'row', alignItems:'center', gap:5, marginHorizontal:16, marginBottom:12, flexWrap:'wrap' },
  dot:        { width:8, height:8, borderRadius:4, backgroundColor:COLORS.border2 },
  dotFilled:  { backgroundColor:COLORS.gold },
  countText:  { fontSize:12, color:COLORS.muted, marginLeft:8 },
  statusBar:  { marginHorizontal:16, borderRadius:12, padding:12, marginBottom:12 },
  statusOk:   { backgroundColor:'rgba(34,200,132,0.1)', borderWidth:1, borderColor:'rgba(34,200,132,0.2)' },
  statusErr:  { backgroundColor:'rgba(224,92,92,0.1)', borderWidth:1, borderColor:'rgba(224,92,92,0.2)' },
  statusText: { fontSize:13, fontWeight:'600' },
  statusOkText: { color:COLORS.green },
  statusErrText: { color:COLORS.red },
  error:      { color:COLORS.red, fontSize:13, marginHorizontal:16, marginBottom:8 },
  infoCard:   { marginHorizontal:16, backgroundColor:COLORS.surface, borderRadius:14, padding:14, borderWidth:1, borderColor:COLORS.border },
  infoText:   { fontSize:13, color:COLORS.muted, lineHeight:20 },
  footer:     { padding:16, paddingBottom:32 },
  loadingRow: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, height:54 },
  loadingText: { fontSize:14, color:COLORS.muted },
});
