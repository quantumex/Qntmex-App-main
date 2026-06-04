// QNTMEX Wallet - Settings Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, Linking
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ScreenHeader, GoldButton, Spinner } from '../components/shared';
import { COLORS, CHAINS } from '../config';
import { useWallet } from '../hooks/useWalletStore';
import { checkUsernameAvailable, saveUsername as apiSaveUsername, loadUserByWallet } from '../api';

const CHAIN_ORDER = ['ETH', 'BTC', 'SOL', 'BSC', 'TRX'];

export default function SettingsScreen({ onBack }) {
  const { state, dispatch, lockWallet, showToast, deleteWallet } = useWallet();
  const { wallet, currentUser } = state;
  const addrs = wallet?.addrs || {};

  // Username modal
  const [showUsername, setShowUsername] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'available' | 'taken' | 'checking'
  const [savingUsername, setSavingUsername] = useState(false);

  // Seed reveal
  const [showSeed, setShowSeed] = useState(false);
  const [seedRevealed, setSeedRevealed] = useState(false);

  // Addresses modal
  const [showAddresses, setShowAddresses] = useState(false);

  const handleUsernameCheck = async (val) => {
    setUsername(val);
    if (val.length < 3 || !/^[a-z0-9_]+$/i.test(val)) {
      setUsernameStatus(null);
      return;
    }
    setUsernameStatus('checking');
    const avail = await checkUsernameAvailable(val);
    setUsernameStatus(avail ? 'available' : 'taken');
  };

  const handleSaveUsername = async () => {
    if (usernameStatus !== 'available') return;
    setSavingUsername(true);
    const ok = await apiSaveUsername(username.toLowerCase(), addrs);
    setSavingUsername(false);
    if (ok) {
      dispatch({ type: 'SET_USER', payload: { username: username.toLowerCase() } });
      showToast('✓ Username @' + username + ' registered!');
      setShowUsername(false);
    } else {
      showToast('Failed to save username. Try again.');
    }
  };

  const handleLock = () => {
    lockWallet();
    onBack && onBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Wallet',
      'This will remove your wallet from this device. Make sure you have your seed phrase backed up. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWallet() }
      ]
    );
  };

  const copyAddr = async (chain, addr) => {
    await Clipboard.setStringAsync(addr);
    showToast(`✓ ${chain} address copied`);
  };

  const chainColor = { ETH:'#627EEA', BTC:'#F7931A', SOL:'#9945FF', BSC:'#F3BA2F', TRX:'#EB0029' };

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Settings" onBack={onBack} />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <TouchableOpacity style={s.profileCard} onPress={() => setShowUsername(true)}>
          <View style={s.profileAvatar}><Text style={s.profileAvatarText}>Q</Text></View>
          <View style={s.profileInfo}>
            <View style={s.profileNameRow}>
              <Text style={s.profileName}>{currentUser?.username ? '@' + currentUser.username : 'QNTMEX Wallet'}</Text>
              <Text style={s.editIcon}>✎</Text>
            </View>
            <Text style={s.profileSub}>{currentUser?.username ? 'Username registered' : 'Tap to set username'}</Text>
            <Text style={s.profileAddr} numberOfLines={1}>{addrs.ETH?.slice(0,20)}…</Text>
          </View>
        </TouchableOpacity>

        {/* Wallet section */}
        <Text style={s.groupTitle}>WALLET</Text>
        <View style={s.group}>
          <SettingsRow icon="👤" label="Username" sub={currentUser?.username ? '@' + currentUser.username : 'Register for easy transfers'} onPress={() => setShowUsername(true)} />
          <SettingsRow icon="🔑" label="Backup Seed Phrase" sub="12-word recovery phrase" onPress={() => setShowSeed(true)} />
          <SettingsRow icon="📋" label="My Addresses" sub="ETH · BTC · SOL · BSC · TRX" badge="5" onPress={() => setShowAddresses(true)} />
        </View>

        <Text style={s.groupTitle}>SECURITY</Text>
        <View style={s.group}>
          <SettingsRow icon="🔐" label="Change PIN" sub="Update 6-digit passcode" onPress={() => showToast('Change PIN coming soon')} />
          <SettingsRow icon="🔒" label="Lock Wallet" sub="Return to PIN screen" onPress={handleLock} danger />
        </View>

        <Text style={s.groupTitle}>NETWORK STATUS</Text>
        <View style={s.group}>
          <SettingsRow icon="⬡" label="Alchemy (ETH/BSC)" sub="a6WprMu3…zzyPEztKm" badge="Live" badgeGreen />
          <SettingsRow icon="◎" label="Helius (SOL)" sub="3463486c…cb90" badge="Live" badgeGreen />
          <SettingsRow icon="⬟" label="TronGrid (TRX)" sub="8397568d…5843" badge="Live" badgeGreen />
          <SettingsRow icon="₿" label="Mempool.space (BTC)" sub="Public API" badge="Live" badgeGreen />
          <SettingsRow icon="⇄" label="ChangeNow (Swap)" sub="c09775…" badge="Live" badgeGreen />
        </View>

        <Text style={s.groupTitle}>ABOUT</Text>
        <View style={s.group}>
          <SettingsRow icon="🌐" label="qntmex.com" sub="Corporate Website" onPress={() => Linking.openURL('https://qntmex.com')} arrow="↗" />
          <SettingsRow icon="ℹ" label="Version" sub="QNTMEX Wallet · Non-Custodial · Live" badge="v4.0" />
        </View>

        <Text style={s.groupTitle}>DANGER ZONE</Text>
        <View style={s.group}>
          <SettingsRow icon="🗑" label="Delete Wallet" sub="Remove from this device" onPress={handleDelete} danger />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Username Modal */}
      <Modal visible={showUsername} animationType="slide" transparent>
        <View style={m.overlay}>
          <TouchableOpacity style={m.backdrop} onPress={() => setShowUsername(false)} />
          <View style={m.sheet}>
            <View style={m.sheetHeader}>
              <View>
                <Text style={m.sheetTitle}>YOUR USERNAME</Text>
                <Text style={m.sheetSub}>Receive funds by name on all chains</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUsername(false)}><Text style={m.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            <View style={m.inputRow}>
              <Text style={m.atSign}>@</Text>
              <TextInput
                style={m.input}
                value={username}
                onChangeText={handleUsernameCheck}
                placeholder="yourname"
                placeholderTextColor={COLORS.rim}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={m.checkIcon}>
                {usernameStatus === 'checking' ? '…' : usernameStatus === 'available' ? '✓' : usernameStatus === 'taken' ? '✗' : ''}
              </Text>
            </View>
            <Text style={m.hint}>3–20 characters · letters, numbers, _</Text>
            {savingUsername ? <Spinner /> : (
              <GoldButton
                label="SAVE USERNAME"
                onPress={handleSaveUsername}
                disabled={usernameStatus !== 'available'}
                style={m.saveBtn}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Seed Modal */}
      <Modal visible={showSeed} animationType="slide" transparent>
        <View style={m.overlay}>
          <TouchableOpacity style={m.backdrop} onPress={() => { setShowSeed(false); setSeedRevealed(false); }} />
          <View style={[m.sheet, { paddingBottom:32 }]}>
            <View style={m.sheetHeader}>
              <Text style={m.sheetTitle}>SEED PHRASE</Text>
              <TouchableOpacity onPress={() => { setShowSeed(false); setSeedRevealed(false); }}><Text style={m.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            <View style={m.warnBox}>
              <Text style={m.warnText}>⚠️ Never share your seed phrase. Anyone with it has full access to your funds.</Text>
            </View>
            <TouchableOpacity
              style={[m.seedGrid, !seedRevealed && m.seedBlurred]}
              onPress={() => setSeedRevealed(true)}
            >
              {!seedRevealed ? (
                <View style={m.revealBtn}>
                  <Text style={m.revealText}>👁  TAP TO REVEAL</Text>
                </View>
              ) : (
                wallet?.mnemonic?.split(' ').map((w, i) => (
                  <View key={i} style={m.wordChip}>
                    <Text style={m.wordNum}>{i+1}</Text>
                    <Text style={m.wordVal}>{w}</Text>
                  </View>
                ))
              )}
            </TouchableOpacity>
            {seedRevealed && (
              <TouchableOpacity style={m.copyBtn} onPress={async () => { await Clipboard.setStringAsync(wallet.mnemonic); showToast('Seed phrase copied'); }}>
                <Text style={m.copyBtnText}>⊕ COPY PHRASE</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Addresses Modal */}
      <Modal visible={showAddresses} animationType="slide" transparent>
        <View style={m.overlay}>
          <TouchableOpacity style={m.backdrop} onPress={() => setShowAddresses(false)} />
          <View style={[m.sheet, { paddingBottom:32 }]}>
            <View style={m.sheetHeader}>
              <Text style={m.sheetTitle}>MY ADDRESSES</Text>
              <TouchableOpacity onPress={() => setShowAddresses(false)}><Text style={m.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            {CHAIN_ORDER.map(chain => (
              <TouchableOpacity key={chain} style={m.addrRow} onPress={() => copyAddr(chain, addrs[chain] || '')}>
                <View style={[m.addrChainDot, { backgroundColor: chainColor[chain] }]} />
                <View style={{ flex:1 }}>
                  <Text style={m.addrChainName}>{chain}</Text>
                  <Text style={m.addrText} numberOfLines={1}>{addrs[chain] || '—'}</Text>
                </View>
                <Text style={m.addrCopy}>⊕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, sub, onPress, badge, badgeGreen, arrow, danger }) {
  return (
    <TouchableOpacity style={sr.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={sr.ico}>{icon}</Text>
      <View style={sr.txt}>
        <Text style={[sr.lbl, danger && { color: COLORS.red }]}>{label}</Text>
        <Text style={sr.sub}>{sub}</Text>
      </View>
      {badge && (
        <View style={[sr.badge, badgeGreen && sr.badgeGreen]}>
          <Text style={[sr.badgeText, badgeGreen && sr.badgeGreenText]}>{badge}</Text>
        </View>
      )}
      {onPress && !badge && (
        <Text style={sr.arr}>{arrow || '›'}</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:COLORS.bg },
  scroll:       { flex:1 },
  content:      { paddingBottom:20 },
  profileCard:  { flexDirection:'row', alignItems:'center', gap:14, margin:16, padding:16, backgroundColor:COLORS.surface, borderRadius:18, borderWidth:1, borderColor:COLORS.border2 },
  profileAvatar:{ width:48, height:48, borderRadius:14, backgroundColor:'rgba(201,168,76,0.12)', alignItems:'center', justifyContent:'center' },
  profileAvatarText:{ fontSize:22, fontWeight:'800', color:COLORS.gold2 },
  profileInfo:  { flex:1 },
  profileNameRow:{ flexDirection:'row', alignItems:'center', gap:8 },
  profileName:  { fontSize:16, fontWeight:'800', color:COLORS.text },
  editIcon:     { fontSize:12, color:COLORS.gold },
  profileSub:   { fontSize:11, color:COLORS.muted, marginTop:2 },
  profileAddr:  { fontSize:11, color:COLORS.dim, marginTop:3, fontFamily:'System' },
  groupTitle:   { fontSize:10, fontWeight:'700', letterSpacing:2.5, color:COLORS.muted, textTransform:'uppercase', paddingHorizontal:16, paddingTop:20, paddingBottom:8 },
  group:        { marginHorizontal:16, backgroundColor:COLORS.surface, borderRadius:16, borderWidth:1, borderColor:COLORS.border2, overflow:'hidden' },
});
const sr = StyleSheet.create({
  row:      { flexDirection:'row', alignItems:'center', padding:14, borderBottomWidth:1, borderBottomColor:COLORS.border },
  ico:      { fontSize:18, width:32, textAlign:'center', marginRight:4 },
  txt:      { flex:1 },
  lbl:      { fontSize:14, fontWeight:'600', color:COLORS.text, fontFamily:'System' },
  sub:      { fontSize:12, color:COLORS.muted, marginTop:2 },
  badge:    { paddingHorizontal:8, paddingVertical:3, backgroundColor:COLORS.lift, borderRadius:10, borderWidth:1, borderColor:COLORS.border2 },
  badgeGreen:{ backgroundColor:'rgba(34,200,132,0.12)', borderColor:'rgba(34,200,132,0.2)' },
  badgeText: { fontSize:11, fontWeight:'700', color:COLORS.muted },
  badgeGreenText:{ color:COLORS.green },
  arr:      { fontSize:16, color:COLORS.muted },
});
const m = StyleSheet.create({
  overlay:   { flex:1, justifyContent:'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.6)' },
  sheet:     { backgroundColor:COLORS.bg1, borderTopLeftRadius:28, borderTopRightRadius:28, paddingTop:4, paddingHorizontal:20, maxHeight:'85%' },
  sheetHeader:{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', paddingVertical:18, borderBottomWidth:1, borderBottomColor:COLORS.border },
  sheetTitle: { fontSize:14, fontWeight:'800', letterSpacing:1.5, color:COLORS.bright },
  sheetSub:   { fontSize:11, color:COLORS.muted, marginTop:3 },
  closeBtn:   { fontSize:22, color:COLORS.muted, padding:4 },
  inputRow:   { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface2, borderRadius:14, borderWidth:1.5, borderColor:COLORS.border2, marginTop:16, overflow:'hidden' },
  atSign:     { paddingHorizontal:14, fontSize:18, fontWeight:'700', color:COLORS.gold },
  input:      { flex:1, height:50, color:COLORS.text, fontSize:16, fontWeight:'700' },
  checkIcon:  { paddingHorizontal:14, fontSize:18, color:COLORS.green },
  hint:       { fontSize:11, color:COLORS.muted, marginTop:8, marginBottom:16 },
  saveBtn:    { marginTop:8 },
  warnBox:    { backgroundColor:'rgba(201,168,76,0.08)', borderRadius:12, padding:12, marginTop:16, borderWidth:1, borderColor:'rgba(201,168,76,0.18)' },
  warnText:   { fontSize:13, color:COLORS.text2, lineHeight:20 },
  seedGrid:   { flexDirection:'row', flexWrap:'wrap', gap:8, justifyContent:'center', marginTop:16, minHeight:100 },
  seedBlurred:{ alignItems:'center', justifyContent:'center', backgroundColor:COLORS.surface, borderRadius:16, borderWidth:1, borderColor:COLORS.border2, padding:24 },
  revealBtn:  { padding:20 },
  revealText: { fontSize:14, fontWeight:'700', color:COLORS.muted, letterSpacing:1.5 },
  wordChip:   { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:COLORS.surface, borderRadius:10, paddingHorizontal:10, paddingVertical:6 },
  wordNum:    { fontSize:10, fontWeight:'600', color:COLORS.muted, width:14, textAlign:'right' },
  wordVal:    { fontSize:14, fontWeight:'700', color:COLORS.text },
  copyBtn:    { marginTop:16, paddingVertical:12, borderRadius:12, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border2, alignItems:'center' },
  copyBtnText:{ fontSize:13, fontWeight:'700', color:COLORS.gold, letterSpacing:1 },
  addrRow:    { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:COLORS.border },
  addrChainDot:{ width:10, height:10, borderRadius:5 },
  addrChainName:{ fontSize:11, fontWeight:'700', color:COLORS.muted, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 },
  addrText:   { fontSize:12, color:COLORS.text2, fontFamily:'System' },
  addrCopy:   { fontSize:18, color:COLORS.gold },
});
