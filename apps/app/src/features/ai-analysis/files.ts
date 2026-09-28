import { Directory, File, Paths } from 'expo-file-system';
export async function importVideo(memberId: string, sessionId: string, uri: string) {
  if (!uri.startsWith('file:') && !uri.startsWith('content:')) throw new Error('Chỉ nhận video từ thiết bị.');
  const dir = new Directory(Paths.document, 'ai', memberId);
  dir.create({ intermediates: true, idempotent: true });
  const target = new File(dir, sessionId + '.mp4');
  new File(uri).copy(target);
  return target.uri;
}
export async function videoUri(uri: string) {
  if (!uri.startsWith('file:') || !new File(uri).exists) throw new Error('Video không còn trên thiết bị.');
  return uri;
}
export function releaseVideo(_uri: string) {}
export async function deleteVideo(memberId: string, uri: string) {
  const parent = new Directory(Paths.document, 'ai', memberId).uri.replace(/\/$/, '');
  if (!uri.startsWith(parent + '/')) throw new Error('File không thuộc tài khoản này.');
  const file = new File(uri); if (file.exists) file.delete();
}
