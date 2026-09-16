import { z } from 'zod';

export const roleSchema = z.enum(['OWNER_ADMIN', 'PT', 'MEMBER']);
export type Role = z.infer<typeof roleSchema>;

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: z.object({ id: z.string().min(1), role: roleSchema }),
});

export type Session = z.infer<typeof sessionSchema>;

export function roleRoute(role: Role): '/owner_admin' | '/pt' | '/member' {
  if (role === 'OWNER_ADMIN') return '/owner_admin';
  if (role === 'PT') return '/pt';
  return '/member';
}
