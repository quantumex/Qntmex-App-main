// Polyfills - must be loaded first
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

// QNTMEX Wallet - Main App
// React Native / Expo implementation matching walletqntmex.com V6

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Platform,
  TouchableOpacity, Modal
} from 'react-native';
import { WalletProvider, useWallet } from './src/hooks/useWalletStore';
import { Toast } from './src/components/shared';
import { COLORS } from './src/config';

// Screens
import LockScreen from './src/screens/LockScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CreateScreen from './src/screens/CreateScreen';
import ImportScreen from './src/screens/ImportScreen';
import SetPinScreen from './src/screens/SetPinScreen';
import HomeScreen from './src/screens/HomeScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import SwapScreen from './src/screens/SwapScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Navigation state
const MAIN_TABS = ['home', 'swap', 'history', 'settings'];

function AppContent() {
  const { state, dispatch } = useWallet();
  const { screen, toast } = state;

  // Local nav state for main app
  const [activeTab, setActiveTab] = useState('home');
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [pendingWallet, setPendingWallet] = useState(null); // wallet waiting for PIN

  const goTo = (s) => dispatch({ type: 'SET_SCREEN', payload: s });

  // ── Onboarding flow ───────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.void} />
        <WelcomeScreen
          onCreate={() => goTo('create')}
          onImport={() => goTo('import')}
        />
        <Toast message={toast} />
      </>
    );
  }

  if (screen === 'create') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <CreateScreen
          onNext={(wallet) => { setPendingWallet(wallet); goTo('setpin'); }}
          onBack={() => goTo('welcome')}
        />
        <Toast message={toast} />
      </>
    );
  }

  if (screen === 'import') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ImportScreen
          onNext={(wallet) => { setPendingWallet(wallet); goTo('setpin'); }}
          onBack={() => goTo('welcome')}
        />
        <Toast message={toast} />
      </>
    );
  }

  if (screen === 'setpin') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <SetPinScreen
          wallet={pendingWallet}
          onBack={() => goTo(pendingWallet ? 'create' : 'welcome')}
        />
        <Toast message={toast} />
      </>
    );
  }

  // ── Lock screen ────────────────────────────────────────────
  if (screen === 'lock') {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <LockScreen />
        <Toast message={toast} />
      </>
    );
  }

  // ── Main app (authenticated) ───────────────────────────────
  if (screen === 'home') {
    return (
      <View style={app.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

        {/* Topbar */}
        <View style={app.topbar}>
          <View style={app.topbarBrand}>
            <Text style={app.topbarShield}>🛡</Text>
            <View>
              <Text style={app.topbarName}>QNTMEX</Text>
              <Text style={app.topbarTag}>Non-Custodial Wallet</Text>
            </View>
          </View>
          <View style={app.topbarRight}>
            <View style={app.chainPill}>
              <View style={app.chainPip} />
              <Text style={app.chainLabel}>MULTI</Text>
            </View>
            <TouchableOpacity
              style={app.lockBtn}
              onPress={() => dispatch({ type: 'SET_SCREEN', payload: 'lock' })}
            >
              <Text style={app.lockIco}>🔒</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen content */}
        <View style={app.content}>
          {activeTab === 'home' && !showSend && !showReceive && (
            <HomeScreen
              onSend={() => setShowSend(true)}
              onReceive={() => setShowReceive(true)}
              onSwap={() => setActiveTab('swap')}
              onOpenToken={() => {}}
            />
          )}
          {activeTab === 'swap' && (
            <SwapScreen onBack={() => setActiveTab('home')} />
          )}
          {activeTab === 'history' && (
            <HistoryScreen onBack={() => setActiveTab('home')} />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen onBack={() => setActiveTab('home')} />
          )}

          {/* Send modal */}
          {showSend && (
            <View style={StyleSheet.absoluteFill}>
              <SendScreen
                onBack={() => setShowSend(false)}
                onScanQR={() => {}} // QR scan can be added
              />
            </View>
          )}

          {/* Receive modal */}
          {showReceive && (
            <View style={StyleSheet.absoluteFill}>
              <ReceiveScreen onBack={() => setShowReceive(false)} />
            </View>
          )}
        </View>

        {/* Bottom nav */}
        {!showSend && !showReceive && (
          <View style={app.botnav}>
            <View style={app.botnavLine} />
            <View style={app.botnavInner}>
              {[
                { id:'home',     icon:'◈', label:'Wallet' },
                { id:'swap',     icon:'⇄', label:'Swap' },
                { id:'history',  icon:'⊟', label:'History' },
                { id:'settings', icon:'⊙', label:'Settings' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={app.navBtn}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[app.navIcon, activeTab === tab.id && app.navIconActive]}>{tab.icon}</Text>
                  <Text style={[app.navLabel, activeTab === tab.id && app.navLabelActive]}>{tab.label}</Text>
                  {activeTab === tab.id && <View style={app.navIndicator} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Toast message={toast} />
      </View>
    );
  }

  return null;
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

const app = StyleSheet.create({
  container:      { flex:1, backgroundColor:COLORS.bg },
  topbar:         { height:56, backgroundColor:COLORS.bg, borderBottomWidth:1, borderBottomColor:COLORS.border, flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, zIndex:20 },
  topbarBrand:    { flexDirection:'row', alignItems:'center', gap:9 },
  topbarShield:   { fontSize:22 },
  topbarName:     { fontSize:14, fontWeight:'800', letterSpacing:3, color:COLORS.gold3, textTransform:'uppercase', lineHeight:16 },
  topbarTag:      { fontSize:9, fontWeight:'500', letterSpacing:1.5, color:COLORS.muted, textTransform:'uppercase' },
  topbarRight:    { flexDirection:'row', alignItems:'center', gap:8 },
  chainPill:      { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor:COLORS.goldG1, borderWidth:1, borderColor:COLORS.goldRim },
  chainPip:       { width:6, height:6, borderRadius:3, backgroundColor:COLORS.gold },
  chainLabel:     { fontSize:11, fontWeight:'700', letterSpacing:1, color:COLORS.gold2 },
  lockBtn:        { width:32, height:32, borderRadius:10, backgroundColor:COLORS.surface, borderWidth:1, borderColor:COLORS.border, alignItems:'center', justifyContent:'center' },
  lockIco:        { fontSize:14 },
  content:        { flex:1, backgroundColor:COLORS.bg },
  botnav:         { backgroundColor:COLORS.bg, borderTopWidth:1, borderTopColor:COLORS.border, paddingBottom: Platform.OS === 'ios' ? 20 : 6 },
  botnavLine:     { height:1, backgroundColor:COLORS.border, opacity:0.5 },
  botnavInner:    { flexDirection:'row' },
  navBtn:         { flex:1, alignItems:'center', paddingTop:8, paddingBottom:4, position:'relative' },
  navIcon:        { fontSize:18, color:COLORS.rim, lineHeight:22 },
  navIconActive:  { color:COLORS.gold },
  navLabel:       { fontSize:9, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase', color:COLORS.rim, marginTop:2 },
  navLabelActive: { color:COLORS.gold2 },
  navIndicator:   { position:'absolute', top:0, left:'50%', marginLeft:-12, width:24, height:2, backgroundColor:COLORS.gold3, borderRadius:2 },
});
