// QNTMEX Wallet - Set PIN Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Numpad, PinDots } from '../components/shared';
import { COLORS } from '../config';
import { useWallet } from '../hooks/useWalletStore';

export default function SetPinScreen({ wallet, onBack }) {
  const { saveWallet, showToast } = useWallet();
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [mode, setMode] = useState('set'); // set | confirm
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleKey = (k) => {
    if (pin.length >= 6 || saving) return;
    const next = pin + k;
    setPin(next);
    setError(false);
    if (next.length === 6) setTimeout(() => check(next), 140);
  };

  const handleDel = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  const check = async (p) => {
    if (mode === 'set') {
      setFirst(p);
      setPin('');
      setMode('confirm');
    } else {
      if (p === first) {
        setSaving(true);
        try {
          await saveWallet(wallet, p);
          showToast('✓ Wallet created successfully!');
        } catch (e) {
          showToast('Failed to save wallet');
          setSaving(false);
        }
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setFirst('');
          setMode('set');
          setError(false);
        }, 700);
        showToast('PINs do not match');
      }
    }
  };

  const label = mode === 'set'
    ? 'Choose a 6-digit PIN\nto protect your wallet'
    : 'Confirm your PIN';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.glow} />

        <View style={s.brand}>
          <Text style={s.shield}>🛡</Text>
          <Text style={s.wordmark}>QNTMEX</Text>
        </View>

        <Text style={s.label}>{label}</Text>

        <PinDots length={pin.length} error={error} />

        {saving ? (
          <Text style={s.saving}>Creating wallet…</Text>
        ) : (
          <Numpad onKey={handleKey} onDel={handleDel} />
        )}

        {/* Step indicator */}
        <View style={s.steps}>
          <View style={[s.step, mode === 'set' && s.stepActive]}>
            <Text style={[s.stepLabel, mode === 'set' && s.stepLabelActive]}>SET</Text>
          </View>
          <View style={s.stepLine} />
          <View style={[s.step, mode === 'confirm' && s.stepActive]}>
            <Text style={[s.stepLabel, mode === 'confirm' && s.stepLabelActive]}>CONFIRM</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex:1, backgroundColor:COLORS.bg },
  container:       { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:28, paddingBottom:32 },
  glow:            { position:'absolute', top:-80, left:'50%', marginLeft:-180, width:360, height:360, borderRadius:180, backgroundColor:'rgba(201,168,76,0.06)' },
  brand:           { alignItems:'center', marginBottom:32 },
  shield:          { fontSize:48, marginBottom:8 },
  wordmark:        { fontSize:22, fontWeight:'800', letterSpacing:5, color:COLORS.gold3, textTransform:'uppercase' },
  label:           { fontSize:16, color:COLORS.text2, textAlign:'center', marginBottom:36, lineHeight:24 },
  saving:          { fontSize:15, color:COLORS.muted, marginTop:20 },
  steps:           { flexDirection:'row', alignItems:'center', marginTop:40, gap:12 },
  step:            { paddingHorizontal:14, paddingVertical:6, borderRadius:20, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2 },
  stepActive:      { backgroundColor:'rgba(201,168,76,0.1)', borderColor:'rgba(201,168,76,0.3)' },
  stepLabel:       { fontSize:10, fontWeight:'700', letterSpacing:2, color:COLORS.muted, textTransform:'uppercase' },
  stepLabelActive: { color:COLORS.gold2 },
  stepLine:        { width:20, height:1, backgroundColor:COLORS.border2 },
});
