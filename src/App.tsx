import { Sen_400Regular, Sen_700Bold, Sen_800ExtraBold, useFonts } from '@expo-google-fonts/sen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, Loading, usePalette } from './ds';
import { SessionProvider, useSession } from './features/session';
import { ShiftProvider, useShift } from './features/shift';
import { EarningsScreen } from './screens/EarningsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';

type Tab = 'home' | 'earnings' | 'history' | 'profile';
const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Corridas' },
  { key: 'earnings', label: 'Ganhos' },
  { key: 'history', label: 'Histórico' },
  { key: 'profile', label: 'Perfil' },
];

/** Barra inferior simples (quatro telas, sem biblioteca de navegação) */
function Tabs() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const { status } = useShift();
  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'earnings' && <EarningsScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'profile' && <ProfileScreen />}
      </View>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surface, paddingBottom: insets.bottom }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const dot = t.key === 'home' && tab !== 'home' && (status?.offer || status?.active.length);
          return (
            <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setTab(t.key)} style={{ flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <View style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: active ? c.primary : 'transparent' }} />
              <Text style={{ fontFamily: font.bold, fontSize: 12, color: active ? c.primaryText : c.muted }}>
                {t.label}
                {dot ? ' •' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Root() {
  const { ready, me } = useSession();
  if (!ready) return <Loading />;
  if (!me) return <LoginScreen />;
  return (
    <ShiftProvider>
      <Tabs />
    </ShiftProvider>
  );
}

export default function App() {
  const [fonts] = useFonts({ Sen_400Regular, Sen_700Bold, Sen_800ExtraBold });
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      {fonts ? (
        <SessionProvider>
          <Root />
        </SessionProvider>
      ) : (
        <Loading />
      )}
    </SafeAreaProvider>
  );
}
