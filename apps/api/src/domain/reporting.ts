export function reportMonthRange(year: number, month: number) {
  const offset = 7 * 60 * 60 * 1000;
  return { gte: new Date(Date.UTC(year, month - 1, 1) - offset), lt: new Date(Date.UTC(year, month, 1) - offset) };
}

export function summarizePackages(rows: { name: string; mode: string; memberId: string; _count: { _all: number } }[]) {
  const groups = new Map<string, { name: string; mode: string; members: Set<string>; registrations: number }>();
  for (const row of rows) {
    const key = JSON.stringify([row.name, row.mode]);
    const group = groups.get(key) ?? { name: row.name, mode: row.mode, members: new Set<string>(), registrations: 0 };
    group.members.add(row.memberId);
    group.registrations += row._count._all;
    groups.set(key, group);
  }
  return [...groups.values()].map(({ name, mode, members, registrations }) => ({ name, mode, memberCount: members.size, registrations }))
    .sort((a, b) => b.memberCount - a.memberCount || a.name.localeCompare(b.name, 'vi'));
}
