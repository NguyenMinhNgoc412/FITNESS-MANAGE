import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'fitness.session';
let webSession: string | null = null;

export async function readStoredSession(): Promise<string | null> {
  if (Platform.OS === 'web') return webSession;
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function writeStoredSession(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSession = value;
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

export async function removeStoredSession(): Promise<void> {
  if (Platform.OS === 'web') {
    webSession = null;
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
