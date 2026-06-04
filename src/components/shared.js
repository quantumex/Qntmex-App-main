// QNTMEX Wallet - Shared UI Components
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { COLORS } from '../config';

// ── NUMPAD ────────────────────────────────────────────────
export function Numpad({ onKey, onDel }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <View style={np.grid}>
      {keys.map((k, i) => {
        if (k === '') return <View key={i} style={np.empty} />;
        const isDel = k === '⌫';
        return (
          <TouchableOpacity
            key={i}
            style={[np.key, isDel && np.del]}
            onPress={() => isDel ? onDel() : onKey(k)}
            activeOpacity={0.7}
          >
            <Text style={[np.label, isDel && np.delLabel]}>{k}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const np = StyleSheet.create({
  grid: { flexDirection:'row', flexWrap:'wrap', width: 300, justifyContent:'center', gap: 10 },
  key:  { width:88, height:72, borderRadius:18, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2, alignItems:'center', justifyContent:'center' },
  del:  { backgroundColor:'transparent', borderColor:'transparent' },
  label:{ fontSize:26, fontWeight:'700', color:COLORS.text, fontFamily:'System' },
  delLabel: { fontSize:22, color:COLORS.muted },
  empty: { width:88, height:72 },
});

// ── PIN DOTS ──────────────────────────────────────────────
export function PinDots({ length = 0, error = false }) {
  return (
    <View style={pd.row}>
      {[0,1,2,3,4,5].map(i => (
        <View key={i} style={[
          pd.dot,
          i < length && pd.lit,
          error && pd.err
        ]} />
      ))}
    </View>
  );
}
const pd = StyleSheet.create({
  row: { flexDirection:'row', gap:16, marginBottom:44 },
  dot: { width:12, height:12, borderRadius:6, backgroundColor:'transparent', borderWidth:1.5, borderColor:COLORS.border2 },
  lit: { backgroundColor:COLORS.gold, borderColor:COLORS.gold },
  err: { backgroundColor:COLORS.red, borderColor:COLORS.red },
});

// ── GOLD BUTTON ───────────────────────────────────────────
export function GoldButton({ label, onPress, disabled, style }) {
  return (
    <TouchableOpacity
      style={[btn.gold, disabled && btn.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={btn.goldLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
export function GhostButton({ label, onPress, style }) {
  return (
    <TouchableOpacity style={[btn.ghost, style]} onPress={onPress} activeOpacity={0.8}>
      <Text style={btn.ghostLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
const btn = StyleSheet.create({
  gold:  { height:54, borderRadius:18, backgroundColor:COLORS.gold2, alignItems:'center', justifyContent:'center' },
  disabled: { opacity:0.35 },
  goldLabel: { fontSize:15, fontWeight:'700', letterSpacing:1, color:'#040302', fontFamily:'System' },
  ghost: { height:54, borderRadius:18, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2, alignItems:'center', justifyContent:'center' },
  ghostLabel: { fontSize:15, fontWeight:'600', color:COLORS.text2, fontFamily:'System' },
});

// ── SCREEN HEADER ─────────────────────────────────────────
export function ScreenHeader({ title, onBack, right }) {
  return (
    <View style={sh.row}>
      {onBack && (
        <TouchableOpacity style={sh.back} onPress={onBack} activeOpacity={0.7}>
          <Text style={sh.backIcon}>←</Text>
        </TouchableOpacity>
      )}
      <Text style={sh.title}>{title}</Text>
      {right && <View style={sh.right}>{right}</View>}
    </View>
  );
}
const sh = StyleSheet.create({
  row:      { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingTop:14, paddingBottom:8 },
  back:     { width:34, height:34, borderRadius:10, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border, alignItems:'center', justifyContent:'center' },
  backIcon: { fontSize:18, color:COLORS.text2, fontWeight:'600' },
  title:    { flex:1, fontSize:20, fontWeight:'800', color:COLORS.text, letterSpacing:0.3 },
  right:    {},
});

// ── CHAIN BADGE ───────────────────────────────────────────
export function ChainBadge({ chain }) {
  const colors = {
    ETH:'#627EEA', BTC:'#F7931A', SOL:'#9945FF', BSC:'#F3BA2F', TRX:'#EB0029'
  };
  return (
    <View style={[cb.pill, { borderColor:'rgba(' + hexToRgb(colors[chain]) + ',0.3)' }]}>
      <View style={[cb.pip, { backgroundColor:colors[chain] }]} />
      <Text style={[cb.label, { color:colors[chain] }]}>{chain}</Text>
    </View>
  );
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
const cb = StyleSheet.create({
  pill:  { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor:'rgba(201,168,76,0.06)', borderWidth:1 },
  pip:   { width:6, height:6, borderRadius:3 },
  label: { fontSize:11, fontWeight:'700', letterSpacing:1, fontFamily:'System' },
});

// ── INPUT FIELD ───────────────────────────────────────────
export function WalletInput({ label, placeholder, value, onChangeText, mono, multiline, right, keyboardType }) {
  return (
    <View style={inp.block}>
      {label && <Text style={inp.lbl}>{label}</Text>}
      <View style={inp.wrap}>
        <TextInput
          style={[inp.input, mono && inp.mono, multiline && inp.multi]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.rim}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={COLORS.gold}
        />
        {right && <View style={inp.rightEl}>{right}</View>}
      </View>
    </View>
  );
}
const inp = StyleSheet.create({
  block:   { marginHorizontal:16, marginBottom:12 },
  lbl:     { fontSize:11, fontWeight:'700', letterSpacing:1.5, textTransform:'uppercase', color:COLORS.muted, marginBottom:8, fontFamily:'System' },
  wrap:    { position:'relative' },
  input:   { width:'100%', backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2, borderRadius:18, paddingHorizontal:16, paddingVertical:13, color:COLORS.text, fontSize:15, fontFamily:'System' },
  mono:    { fontSize:12, letterSpacing:0.5 },
  multi:   { minHeight:80, textAlignVertical:'top' },
  rightEl: { position:'absolute', right:12, top:'50%', transform:[{translateY:-12}] },
});

// ── TOAST ─────────────────────────────────────────────────
export function Toast({ message }) {
  if (!message) return null;
  return (
    <View style={ts.wrap} pointerEvents="none">
      <View style={ts.box}>
        <Text style={ts.text}>{message}</Text>
      </View>
    </View>
  );
}
const ts = StyleSheet.create({
  wrap: { position:'absolute', bottom:100, left:0, right:0, alignItems:'center', zIndex:999 },
  box:  { backgroundColor:'rgba(30,27,18,0.95)', paddingHorizontal:20, paddingVertical:12, borderRadius:24, borderWidth:1, borderColor:COLORS.border2, maxWidth:280 },
  text: { color:COLORS.text, fontSize:14, fontWeight:'600', textAlign:'center', fontFamily:'System' },
});

// ── SECTION HEADER ────────────────────────────────────────
export function SectionTitle({ label }) {
  return <Text style={sec.title}>{label}</Text>;
}
const sec = StyleSheet.create({
  title: { fontSize:11, fontWeight:'700', letterSpacing:2.5, textTransform:'uppercase', color:COLORS.muted, paddingHorizontal:18, paddingTop:20, paddingBottom:8, fontFamily:'System' },
});

// ── LOADING INDICATOR ─────────────────────────────────────
export function Spinner({ color }) {
  return <ActivityIndicator color={color || COLORS.gold} size="small" />;
}
