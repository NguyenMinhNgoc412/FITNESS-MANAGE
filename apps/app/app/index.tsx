import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { roleRoute } from '../src/features/auth/types';
export default function Index() {
  const { session, hydrated } = useAuthStore();
  // Expo handles '/' before Metro's header middleware. A client-side redirect
  // would retain that document's missing isolation and break SQLite WASM.
  const loadLoginDocument = hydrated && !session && Platform.OS === 'web' && typeof window !== 'undefined' && !window.crossOriginIsolated;
  useEffect(() => { if (loadLoginDocument) window.location.replace('/login'); }, [loadLoginDocument]);
  if (!hydrated || loadLoginDocument) return <ActivityIndicator />;
  return <Redirect href={session ? roleRoute(session.user.role) : '/login'} />;
}
