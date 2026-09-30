import { endAfterMonths, membershipPresets } from './membership-presets';

describe('membership presets', () => {
  it('offers the requested gym entry packages with decreasing unit prices', () => {
    expect(membershipPresets.filter(item => item.mode === 'SESSION_BASED').map(item => item.totalSessions)).toEqual([15, 30, 45]);
    expect(membershipPresets.filter(item => item.mode === 'TIME_BASED').map(item => item.months)).toEqual([3, 6, 12]);
    expect(new Set(membershipPresets.map(item => item.id)).size).toBe(6);
    expect(membershipPresets.every(item => Number.isInteger(item.priceVnd) && item.priceVnd > 0)).toBe(true);
  });

  it('clamps a month-end start to the last day of the target month', () => {
    const end = new Date(endAfterMonths(new Date(2026, 0, 31).toISOString(), 3));
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([2026, 3, 30]);
  });
});
