const validId = (value: string) => /^[a-f0-9]{24}$/i.test(value);
function reject(message: string): never { throw { response: { data: { message } } }; }
export function memberCheckinBody(values: Record<string, string>, memberId: string, context: string, token: string) {
  if (!validId(memberId)) reject('Thông tin Member chưa hợp lệ. Quét lại QR hoặc tra cứu lại.');
  if (!validId(values.membershipId ?? '')) reject('Chọn gói tập đang hoạt động trước khi xác nhận vào tập.');
  if (context !== 'SELF_TRAINING' && context !== 'WITH_INTERNAL_PT') reject('Chọn hình thức tự tập hoặc PT nội bộ.');
  if (context === 'WITH_INTERNAL_PT' && !validId(values.bookingId ?? '')) reject('Chọn booking của Member khi tập với PT nội bộ.');
  return {
    memberId, membershipId: values.membershipId, context,
    method: token ? 'QR' : 'PHONE',
    ...(token ? { qrToken: token } : {}),
    ...(context === 'WITH_INTERNAL_PT' ? { bookingId: values.bookingId } : {}),
  };
}
