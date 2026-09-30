export type MembershipPreset = {
  id: string;
  name: string;
  mode: 'SESSION_BASED' | 'TIME_BASED';
  priceVnd: number;
  totalSessions?: number;
  months?: number;
};

// Suggested gym access prices. The sold Membership keeps its own price snapshot.
export const membershipPresets: MembershipPreset[] = [
  { id: 'sessions-15', name: 'Hội viên 15 buổi', mode: 'SESSION_BASED', totalSessions: 15, priceVnd: 1_200_000 },
  { id: 'sessions-30', name: 'Hội viên 30 buổi', mode: 'SESSION_BASED', totalSessions: 30, priceVnd: 2_100_000 },
  { id: 'sessions-45', name: 'Hội viên 45 buổi', mode: 'SESSION_BASED', totalSessions: 45, priceVnd: 2_700_000 },
  { id: 'months-3', name: 'Hội viên 3 tháng', mode: 'TIME_BASED', months: 3, priceVnd: 1_800_000 },
  { id: 'months-6', name: 'Hội viên 6 tháng', mode: 'TIME_BASED', months: 6, priceVnd: 3_000_000 },
  { id: 'months-12', name: 'Hội viên 12 tháng', mode: 'TIME_BASED', months: 12, priceVnd: 5_400_000 },
];

export function endAfterMonths(startIso: string, months: number): string {
  const start = new Date(startIso);
  const firstOfTarget = new Date(start.getFullYear(), start.getMonth() + months, 1);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + months + 1, 0).getDate();
  firstOfTarget.setDate(Math.min(start.getDate(), lastDay));
  return firstOfTarget.toISOString();
}
