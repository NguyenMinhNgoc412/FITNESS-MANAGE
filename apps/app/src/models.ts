export type Person = { id: string; phone: string; role: string; status: string; profile: { fullName: string; cccd?: string } };
export type Customer = { id: string; fullName: string; phone: string; status: string; memberUserId?: string; member?: { id: string; status: string; profile: { fullName: string; cccd?: string | null } | null } | null; trial?: { totalSessions: number; usedSessions: number; status: string }; checkins?: Checkin[] };
export type Membership = { id: string; name: string; memberId: string; mode: string; effectiveStatus: string; startAt: string; endAt?: string; remainingSessions?: number; totalSessions?: number; usedSessions: number; priceVnd?: number | null };
export type Booking = { id: string; memberId: string; ptId: string; memberName?: string; ptName?: string; startAt: string; endAt: string; status: string; cancelReason?: string };
export type Checkin = { id: string; memberId?: string; customerId?: string; ptId?: string; checkedInAt: string; context?: string; method?: string };
export type Pass = { id: string; totalUses: number; usedUses: number; status: string };
export type ExternalRequest = { id: string; memberId: string; createdAt: string; status: string };
