import { HttpException } from '@nestjs/common';
import { memberCheckinInput, parseMemberCheckin } from './input';
describe('check-in input contract', () => {
  const body = { memberId: '1'.repeat(24), membershipId: '2'.repeat(24), context: 'SELF_TRAINING', method: 'QR', qrToken: 'synthetic-token' };
  it('accepts QR self-training and phone/internal booking', () => {
    expect(parseMemberCheckin(body)).toEqual(body);
    expect(memberCheckinInput.safeParse({ ...body, context: 'WITH_INTERNAL_PT', bookingId: '3'.repeat(24), method: 'PHONE', qrToken: undefined }).success).toBe(true);
  });
  it.each([['membershipId', 'Chọn gói'], ['bookingId', 'Chọn booking']])('reports empty %s without exposing token or IDs', (field, message) => {
    try { parseMemberCheckin({ ...body, [field]: '' }); throw new Error('Expected rejection'); }
    catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const response = (error as HttpException).getResponse() as { message: string };
      expect(response.message).toContain(message);
      expect(response.message).not.toContain(body.qrToken);
      expect(response.message).not.toContain(body.memberId);
    }
  });
  it('rejects injected fields and unsupported external PT context', () => {
    expect(memberCheckinInput.safeParse({ ...body, role: 'OWNER' }).success).toBe(false);
    expect(memberCheckinInput.safeParse({ ...body, context: 'WITH_EXTERNAL_PT' }).success).toBe(false);
  });
});
