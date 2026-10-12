import { memberCheckinBody } from './checkin-input';
describe('counter check-in payload', () => {
  const member = '1'.repeat(24), membership = '2'.repeat(24), booking = '3'.repeat(24);
  const messageOf = (values: Record<string, string>, context = 'SELF_TRAINING') => {
    try { memberCheckinBody(values, member, context, 'synthetic-token'); }
    catch (error) { return (error as { response: { data: { message: string } } }).response.data.message; }
    throw new Error('Expected rejection');
  };
  it('blocks QR confirmation when no package has been selected', () => {
    expect(messageOf({ membershipId: '' })).toContain('Chọn gói tập');
  });
  it('blocks empty internal PT booking', () => {
    expect(messageOf({ membershipId: membership, bookingId: '' }, 'WITH_INTERNAL_PT')).toContain('Chọn booking');
  });
  it('omits stale optional booking fields for self-training and retains QR token', () => {
    expect(memberCheckinBody({ membershipId: membership, bookingId: '' }, member, 'SELF_TRAINING', 'synthetic-token')).toEqual({ memberId: member, membershipId: membership, context: 'SELF_TRAINING', method: 'QR', qrToken: 'synthetic-token' });
  });
  it('supports phone fallback without a token and internal booking', () => {
    expect(memberCheckinBody({ membershipId: membership, bookingId: booking }, member, 'WITH_INTERNAL_PT', '')).toEqual({ memberId: member, membershipId: membership, bookingId: booking, context: 'WITH_INTERNAL_PT', method: 'PHONE' });
  });
  it('does not bypass the separate external PT flow', () => {
    expect(messageOf({ membershipId: membership }, 'WITH_EXTERNAL_PT')).toContain('Chọn hình thức');
  });
});
