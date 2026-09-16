export type VideoAssetInfo = { name: string; mimeType?: string | null };

const supportedMimeTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export function inferVideoMimeType(asset: VideoAssetInfo): string | null {
  if (asset.mimeType && supportedMimeTypes.has(asset.mimeType)) return asset.mimeType;
  const extension = asset.name.split('.').pop()?.toLowerCase();
  if (extension === 'mp4') return 'video/mp4';
  if (extension === 'webm') return 'video/webm';
  if (extension === 'mov') return 'video/quicktime';
  return null;
}

export function createUploadKey(userId: string, now = Date.now(), random = Math.random()): string {
  return `${userId}-${now}-${random.toString(36).slice(2)}`;
}
