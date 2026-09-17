import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export type ProfilePreferences = { avatarUri?: string };

function key(userId: string) { return `fitness.profile.${userId}`; }

export async function persistAvatar(userId: string, sourceUri: string, mimeType?: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(sourceUri)).blob();
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(blob); });
  }
  const extension = mimeType?.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const source = new File(sourceUri);
  const destination = new File(Paths.document, `fitness-avatar-${userId}.${extension}`);
  if (destination.exists) destination.delete();
  source.copy(destination);
  return destination.uri;
}

export async function readProfilePreferences(userId: string): Promise<ProfilePreferences> {
  const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(key(userId)) : await SecureStore.getItemAsync(key(userId));
  if (!raw) return {};
  try { return JSON.parse(raw) as ProfilePreferences; } catch { return {}; }
}

export async function writeProfilePreferences(userId: string, value: ProfilePreferences): Promise<void> {
  const raw = JSON.stringify(value);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(key(userId), raw);
  else await SecureStore.setItemAsync(key(userId), raw, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
