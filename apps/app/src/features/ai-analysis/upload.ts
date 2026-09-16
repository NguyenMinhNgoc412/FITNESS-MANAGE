import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { UploadIntent } from './types';

export async function uploadPrivateVideo(intent: UploadIntent, uri: string, mimeType: string): Promise<void> {
  if (!intent.upload) throw new Error('UPLOAD_AUTHORIZATION_MISSING');
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('SUPABASE_NOT_CONFIGURED');
  const headers = {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
    'content-type': mimeType,
    'x-upsert': 'false',
  };
  const response = await fetch(intent.upload.signedUrl, { method: 'POST', headers, body: new File(uri) });
  if (!response.ok) throw new Error(`UPLOAD_FAILED_${response.status}`);
}
