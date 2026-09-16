import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Session, sessionSchema } from './features/auth/types';
import { useAuthStore } from './store/auth';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
export const api = axios.create({ baseURL, timeout: 30_000 });
const refreshClient = axios.create({ baseURL, timeout: 30_000 });
let refreshPromise: Promise<Session> | null = null;

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().session?.accessToken;
  if (accessToken && !config.headers.Authorization) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthEndpoint = request?.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || !request || request._retry || isAuthEndpoint) return Promise.reject(error);

    const refreshToken = useAuthStore.getState().session?.refreshToken;
    if (!refreshToken) {
      await useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    request._retry = true;
    refreshPromise ??= refreshClient
      .post('/auth/refresh', { refreshToken })
      .then(async ({ data }) => {
        const session = sessionSchema.parse(data);
        await useAuthStore.getState().setSession(session);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });

    try {
      const session = await refreshPromise;
      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(request);
    } catch (refreshError) {
      await useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    }
  },
);

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    await useAuthStore.getState().clear();
  }
}
