import { z } from 'zod';

const identity = z.object({
  cccd: z.string().regex(/^[0-9]{12}$/, 'CCCD phải gồm đúng 12 chữ số.'),
  password: z.string().min(10, 'Mật khẩu phải có ít nhất 10 ký tự.').max(72, 'Mật khẩu không được quá 72 ký tự.'),
});
function reject(message: string): never {
  // Existing Form displays safe response messages without exposing input values.
  throw { response: { data: { message } } };
}
export function localDateValue(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function conversionBody<T>(values: Record<string, string>, buildMembership: () => T) {
  const checked = identity.safeParse(values);
  if (!checked.success) reject(checked.error.issues[0].message);
  let membership: T;
  try { membership = buildMembership(); }
  catch (error) {
    if (error instanceof z.ZodError) reject(error.issues[0]?.message || 'Kiểm tra ngày bắt đầu và ngày kết thúc của gói.');
    throw error;
  }
  return { ...checked.data, membership };
}
