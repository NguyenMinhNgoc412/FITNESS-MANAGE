import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { roleRoute } from '../src/features/auth/types';
export default function Index() {
  const { session, hydrated } = useAuthStore();
  if (!hydrated) return <ActivityIndicator />;
  return <Redirect href={session ? roleRoute(session.user.role) : '/login'} />;
}
