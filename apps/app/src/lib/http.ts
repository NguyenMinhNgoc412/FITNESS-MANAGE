import { api } from '../api';

export function errorMessage(error: unknown) {
  const candidate = error as { response?: { status?: number; data?: { message?: unknown } } };
  if (candidate.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  const message = candidate.response?.data?.message;
  return typeof message === 'string' ? message : 'Không thể kết nối. Vui lòng thử lại.';
}
export const mutation = (url: string, body: unknown, key: string, method: 'post' | 'patch' | 'delete' = 'post') => api.request({ method, url, data: body, headers: { 'Idempotency-Key': key } });
