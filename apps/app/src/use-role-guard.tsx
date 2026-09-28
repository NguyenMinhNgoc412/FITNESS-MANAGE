import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from './design-system/theme';
import { Role, roleRoute } from './features/auth/types';
import { useAuthStore } from './store/auth';

export function useRoleGuard(role: Role) {
  const router = useRouter(); const session = useAuthStore((state) => state.session); const hydrated = useAuthStore((state) => state.hydrated);
  useEffect(() => { if (!hydrated) return; if (!session) router.replace('/login'); else if (session.user.role !== role) router.replace(roleRoute(session.user.role)); }, [hydrated, role, router, session]);
  return hydrated && session?.user.role === role;
}
export function useAuthGuard() {
  const router = useRouter(); const session = useAuthStore((state) => state.session); const hydrated = useAuthStore((state) => state.hydrated);
  useEffect(() => { if (hydrated && !session) router.replace('/login'); }, [hydrated, router, session]);
  return hydrated ? session : null;
}
export function GuardFallback() { return <View style={styles.guard} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.guardText}>Đang kiểm tra phiên và quyền truy cập...</Text></View>; }
const styles = StyleSheet.create({ guard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background, padding: 24 }, guardText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' } });
