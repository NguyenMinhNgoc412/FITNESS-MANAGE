import { resolveApiBaseUrl } from './api-base-url';

describe('API base URL', () => {
  it('dùng host Metro thay cho localhost khi chạy Expo Go trong development', () => {
    expect(resolveApiBaseUrl({
      configuredUrl: 'http://localhost:3000/api',
      hostUri: '192.168.88.185:8081',
      isDevelopment: true,
      isWeb: false,
    })).toBe('http://192.168.88.185:3000/api');
  });

  it('giữ nguyên URL production và URL web', () => {
    expect(resolveApiBaseUrl({
      configuredUrl: 'https://api.fitness.example/api',
      hostUri: '192.168.88.185:8081',
      isDevelopment: true,
      isWeb: false,
    })).toBe('https://api.fitness.example/api');

    expect(resolveApiBaseUrl({
      configuredUrl: 'http://localhost:3000/api',
      hostUri: '192.168.88.185:8081',
      isDevelopment: true,
      isWeb: true,
    })).toBe('http://localhost:3000/api');
  });

  it('fallback về localhost khi Metro host không có', () => {
    expect(resolveApiBaseUrl({ isDevelopment: true, isWeb: false })).toBe('http://localhost:3000/api');
  });
});
