const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

type ResolveApiBaseUrlOptions = {
  configuredUrl?: string;
  hostUri?: string;
  isDevelopment: boolean;
  isWeb: boolean;
};

function getMetroHost(hostUri?: string): string | null {
  if (!hostUri) return null;

  try {
    return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname || null;
  } catch {
    return null;
  }
}

function isLoopbackUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

export function resolveApiBaseUrl({ configuredUrl, hostUri, isDevelopment, isWeb }: ResolveApiBaseUrlOptions): string {
  const baseUrl = configuredUrl?.trim() || DEFAULT_API_BASE_URL;
  if (!isDevelopment || isWeb || !isLoopbackUrl(baseUrl)) return baseUrl;

  const metroHost = getMetroHost(hostUri);
  if (!metroHost) return baseUrl;

  const resolved = new URL(baseUrl);
  resolved.hostname = metroHost;
  return resolved.toString().replace(/\/$/, '');
}
