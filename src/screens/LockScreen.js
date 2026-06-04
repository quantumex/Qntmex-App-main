// QNTMEX Wallet - Lock Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Numpad, PinDots } from '../components/shared';
import { COLORS } from '../config';
import { useWallet } from '../hooks/useWalletStore';

const SHIELD_SVG = `🛡`;

export default function LockScreen({ navigation }) {
  const { unlock, showToast, state } = useWallet();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleKey = (k) => {
    if (pin.length >= 6 || checking) return;
    const next = pin + k;
    setPin(next);
    setError(false);
    if (next.length === 6) setTimeout(() => checkPin(next), 140);
  };

  const handleDel = () => {
    setPin(p => p.slice(0, -1));
    setError(false);
  };

  const checkPin = async (p) => {
    setChecking(true);
    const ok = await unlock(p);
    setChecking(false);
    if (!ok) {
      setError(true);
      setTimeout(() => { setPin(''); setError(false); }, 700);
      showToast('Wrong PIN');
    } else {
      setPin('');
    }
  };

  const tryBio = async () => {
    try {
      const hasHW = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHW || !enrolled) {
        showToast('Biometrics not available on this device');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock QNTMEX Wallet',
        cancelLabel: 'Use PIN',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        // We'd need the PIN to decrypt — show message
        showToast('Enter PIN to unlock this session');
      }
    } catch (e) {
      showToast('Biometrics failed');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        {/* Radial glow */}
        <View style={s.glow} />

        {/* Brand */}
        <View style={s.brand}>
          <Text style={s.shield}>🛡</Text>
          <Text style={s.wordmark}>QNTMEX</Text>
          <Text style={s.sub}>WALLET</Text>
        </View>

        {/* PIN dots */}
        <PinDots length={pin.length} error={error} />

        {/* Numpad */}
        <Numpad onKey={handleKey} onDel={handleDel} />

        {/* Bio button */}
        <TouchableOpacity style={s.bioBtn} onPress={tryBio}>
          <Text style={s.bioIcon}>⊙</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex:1, backgroundColor:COLORS.bg },
  container:{ flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal:28, paddingBottom:32 },
  glow:     { position:'absolute', top:-80, left:'50%', marginLeft:-180, width:360, height:360,
              borderRadius:180, backgroundColor:'rgba(201,168,76,0.06)' },
  brand:    { alignItems:'center', marginBottom:52 },
  shield:   { fontSize:64, marginBottom:10 },
  wordmark: { fontSize:24, fontWeight:'800', letterSpacing:6, color:COLORS.gold3, textTransform:'uppercase', fontFamily:'System' },
  sub:      { fontSize:10, fontWeight:'500', letterSpacing:3, color:COLORS.muted, textTransform:'uppercase', marginTop:2 },
  bioBtn:   { marginTop:28, padding:10 },
  bioIcon:  { fontSize:28, color:COLORS.goldDim, opacity:0.7 },
});
