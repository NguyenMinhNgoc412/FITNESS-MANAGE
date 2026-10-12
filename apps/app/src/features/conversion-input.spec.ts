import { z } from 'zod';
import { conversionBody, localDateValue } from './conversion-input';

describe('conversion input feedback', () => {
  const values = { cccd: '0'.repeat(12), password: 'x'.repeat(10) };
  const errorOf = (input: Record<string, string>, build = () => ({})) => {
    try { conversionBody(input, build); } catch (error) { return (error as { response: { data: { message: string } } }).response.data.message; }
    throw new Error('Expected rejection');
  };
  it('accepts credentials and preserves password and leading zeros', () => {
    const membership = { mode: 'SESSION_BASED', totalSessions: 15 };
    expect(conversionBody(values, () => membership)).toEqual({ ...values, membership });
  });
  it('rejects a filled but short CCCD before building or sending a package', () => {
    const build = jest.fn();
    expect(errorOf({ ...values, cccd: '0'.repeat(11) }, build)).toBe('CCCD phải gồm đúng 12 chữ số.');
    expect(build).not.toHaveBeenCalled();
  });
  it('explains both password length bounds without exposing the password', () => {
    expect(errorOf({ ...values, password: 'x'.repeat(9) })).toBe('Mật khẩu phải có ít nhất 10 ký tự.');
    expect(errorOf({ ...values, password: 'x'.repeat(73) })).toBe('Mật khẩu không được quá 72 ký tự.');
  });
  it('shows controlled package/date validation failures', () => {
    expect(errorOf(values, () => { throw new z.ZodError([{ code: 'custom', path: [], message: 'Ngày kết thúc phải sau ngày bắt đầu.' }]); })).toBe('Ngày kết thúc phải sau ngày bắt đầu.');
    expect(errorOf(values, () => { throw new z.ZodError([]); })).toContain('ngày bắt đầu');
  });
  it('formats local calendar date independently of locale', () => {
    expect(localDateValue(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
  });
});
