async function directory(memberId: string) {
  if (!navigator.storage?.getDirectory) throw new Error('Trình duyệt chưa hỗ trợ lưu video local. Dùng ứng dụng điện thoại hoặc trình duyệt hỗ trợ OPFS.');
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle('fitness-ai-' + memberId, { create: true });
}
export async function importVideo(memberId: string, sessionId: string, uri: string) {
  if (!uri.startsWith('blob:')) throw new Error('Chỉ nhận video local.');
  const file = await (await directory(memberId)).getFileHandle(sessionId + '.mp4', { create: true });
  const response = await fetch(uri);
  if (!response.body) throw new Error('Không đọc được video.');
  await response.body.pipeTo(await file.createWritable());
  return 'opfs:' + memberId + '/' + sessionId + '.mp4';
}
export async function videoUri(uri: string) {
  const match = /^opfs:([a-f0-9]{24})\/([a-f0-9-]+\.mp4)$/.exec(uri);
  if (!match) throw new Error('File local không hợp lệ.');
  try { return URL.createObjectURL(await (await (await directory(match[1])).getFileHandle(match[2])).getFile()); }
  catch { throw new Error('Video không còn trên thiết bị.'); }
}
export function releaseVideo(uri: string) { URL.revokeObjectURL(uri); }
export async function deleteVideo(memberId: string, uri: string) {
  const prefix = 'opfs:' + memberId + '/';
  if (!uri.startsWith(prefix) || !/^[a-f0-9-]+\.mp4$/.test(uri.slice(prefix.length))) throw new Error('File không thuộc tài khoản này.');
  await (await directory(memberId)).removeEntry(uri.slice(prefix.length)).catch((e: DOMException) => { if (e.name !== 'NotFoundError') throw e; });
}
