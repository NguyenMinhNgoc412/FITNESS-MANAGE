import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/auth';

export default function Layout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [fontsLoaded] = useFonts({ Inter_500Medium, Inter_600SemiBold, PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  useEffect(() => { void hydrate(); }, [hydrate]);
  if (!fontsLoaded) return <View style={styles.loading}><ActivityIndicator color="#0D9488" size="large" /><Text style={styles.loadingText}>Đang chuẩn bị giao diện...</Text></View>;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FAFBFC' }, loadingText: { color: '#475569', fontSize: 15 } });
