import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../src/design-system';
import { roleRoute } from '../src/features/auth/types';
import { useAuthStore } from '../src/store/auth';

export default function Index() {
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  if (!hydrated) return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!session) return <Redirect href="/login" />;
  return <Redirect href={roleRoute(session.user.role)} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } });
