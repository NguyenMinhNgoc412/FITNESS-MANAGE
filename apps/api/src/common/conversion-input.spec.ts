import { HttpException } from '@nestjs/common';
import { conversionInput, parseConversion } from './input';

describe('conversion contract', () => {
  const body = { cccd: '0'.repeat(12), password: 'x'.repeat(10), membership: { name: 'Synthetic package', mode: 'SESSION_BASED', startAt: '2026-10-08T00:00:00.000Z', totalSessions: 15, priceVnd: 1200000 } };
  it('accepts preset/session and custom/time payloads', () => {
    expect(conversionInput.safeParse(body).success).toBe(true);
    expect(conversionInput.safeParse({ ...body, membership: { name: 'Synthetic time package', mode: 'TIME_BASED', startAt: body.membership.startAt, endAt: '2027-01-08T00:00:00.000Z' } }).success).toBe(true);
  });
  it.each([
    [{ ...body, cccd: '0'.repeat(11) }, 'CCCD'],
    [{ ...body, password: 'x'.repeat(9) }, 'Mật khẩu'],
    [{ ...body, membership: { ...body.membership, priceVnd: 1200000.5 } }, 'Giá gói'],
    [{ ...body, membership: { ...body.membership, totalSessions: 0 } }, 'Số lượt'],
    [{ ...body, membership: { ...body.membership, startAt: '08/10/2026' } }, 'Ngày bắt đầu'],
    [{ ...body, membership: { name: 'Time package', mode: 'TIME_BASED', startAt: body.membership.startAt, endAt: body.membership.startAt } }, 'Gói theo thời gian'],
  ])('reports a safe field-specific error', (invalid, field) => {
    try { parseConversion(invalid); throw new Error('Expected rejection'); }
    catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const response = (error as HttpException).getResponse() as { code: string; message: string };
      expect(response.code).toBe('INVALID_INPUT');
      expect(response.message).toContain(field);
      expect(response.message).not.toContain(body.password);
      expect(response.message).not.toContain(body.cccd);
    }
  });
  it('keeps the strict contract for unknown fields', () => {
    expect(conversionInput.safeParse({ ...body, role: 'OWNER' }).success).toBe(false);
  });
});
