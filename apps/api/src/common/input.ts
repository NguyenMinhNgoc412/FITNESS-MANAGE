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
export const salesAlertFilter = z.enum(['OPEN', 'CONTACTED', 'CONVERTED_RENEWED', 'CLOSED_NOT_CONTINUING', 'ALL']);
export type SalesAlertFilter = z.infer<typeof salesAlertFilter>;
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
export const conversionInput = z.object({ cccd, password, membership: membershipInput }).strict();
export function parseConversion(value: unknown) {
  const result = conversionInput.safeParse(value);
  if (result.success) return result.data;
  const field = result.error.issues[0]?.path.join('.');
  const messages: Record<string, string> = {
    cccd: 'CCCD phải gồm đúng 12 chữ số.',
    password: 'Mật khẩu phải dài từ 10 đến 72 ký tự.',
    membership: 'Gói theo thời gian cần ngày kết thúc sau ngày bắt đầu; gói theo lượt cần số lượt và không có ngày kết thúc.',
    'membership.name': 'Tên gói phải dài từ 1 đến 200 ký tự.',
    'membership.mode': 'Chọn loại gói theo thời gian hoặc theo số lượt.',
    'membership.startAt': 'Ngày bắt đầu gói không hợp lệ.',
    'membership.endAt': 'Ngày kết thúc gói không hợp lệ.',
    'membership.totalSessions': 'Số lượt phải là số nguyên từ 1 đến 10.000.',
    'membership.priceVnd': 'Giá gói phải là số nguyên VNĐ từ 1 đến 1 tỷ.',
  };
  return fail('INVALID_INPUT', messages[field] ?? 'Dữ liệu chuyển thành Member không đúng định dạng.', 400);
}
export const bookingInput = z.object({ memberId: id, ptId: id, startAt: z.string().datetime(), endAt: z.string().datetime(), notes: z.string().max(500).optional() }).strict();
export type BookingInput = z.infer<typeof bookingInput>;
export const memberCheckinInput = z.object({ memberId: id, membershipId: id, context: z.enum(['SELF_TRAINING', 'WITH_INTERNAL_PT']), bookingId: id.optional(), method: z.enum(['PHONE', 'QR']), qrToken: z.string().max(2000).optional() }).strict();
export function parseMemberCheckin(value: unknown) {
  const result = memberCheckinInput.safeParse(value);
  if (result.success) return result.data;
  const messages: Record<string, string> = {
    memberId: 'Thông tin Member không hợp lệ. Quét lại QR hoặc tra cứu lại.',
    membershipId: 'Chọn gói tập đang hoạt động trước khi xác nhận vào tập.',
    bookingId: 'Chọn booking hợp lệ của Member khi tập với PT nội bộ.',
    context: 'Hình thức tập không hợp lệ.', method: 'Phương thức check-in không hợp lệ.',
    qrToken: 'QR không hợp lệ. Làm mới QR trên máy Member rồi quét lại.',
  };
  return fail('INVALID_INPUT', messages[result.error.issues[0]?.path.join('.')] ?? 'Dữ liệu check-in không đúng định dạng.', 400);
}
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
