import { fail } from './errors';
import { z } from 'zod';
export const id = z.string().regex(/^[a-f0-9]{24}$/i);
export const text = z.string().trim().min(1).max(200);
export const reason = z.string().trim().min(1).max(500);
export const phone = z.string().transform(value => {
  const normalized = value.replace(/[\s().-]/g, '');
  return normalized.startsWith('+84') ? '0' + normalized.slice(3) : normalized;
}).pipe(z.string().regex(/^0[0-9]{9}$/));
export const cccd = z.string().regex(/^[0-9]{12}$/);
export const password = z.string().min(10).max(72);
export const membershipInput = z.object({
  mode: z.enum(['TIME_BASED', 'SESSION_BASED']), name: text,
  startAt: z.string().datetime(), endAt: z.string().datetime().optional(),
  totalSessions: z.number().int().positive().max(10000).optional(),
  priceVnd: z.number().int().positive().max(1000000000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.mode === 'TIME_BASED' && (!value.endAt || Date.parse(value.endAt) <= Date.parse(value.startAt) || value.totalSessions !== undefined))
    ctx.addIssue({ code: 'custom', message: 'Time package requires endAt after startAt and no quota.' });
  if (value.mode === 'SESSION_BASED' && (!value.totalSessions || value.endAt !== undefined))
    ctx.addIssue({ code: 'custom', message: 'Session package requires quota and no endAt.' });
});
export type MembershipInput = z.infer<typeof membershipInput>;
export const bookingInput = z.object({ memberId: id, ptId: id, startAt: z.string().datetime(), endAt: z.string().datetime(), notes: z.string().max(500).optional() }).strict();
export type BookingInput = z.infer<typeof bookingInput>;
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) return fail('INVALID_INPUT', 'Dữ liệu không hợp lệ. Kiểm tra các trường bắt buộc.', 400);
  return result.data;
}
export function page(value?: string) {
  const n = Number(value ?? 1);
  if (!Number.isInteger(n) || n < 1 || n > 10000) fail('INVALID_PAGE', 'Trang không hợp lệ.', 400);
  return { skip: (n - 1) * 30, take: 30 };
}
