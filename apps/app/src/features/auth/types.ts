import { z } from 'zod';

export const roleSchema = z.enum(['OWNER', 'PT', 'MEMBER']);
export type Role = z.infer<typeof roleSchema>;

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: z.object({ id: z.string().min(1), role: roleSchema }),
});

export type Session = z.infer<typeof sessionSchema>;

export function roleRoute(role: Role): '/owner' | '/pt' | '/member' {
  if (role === 'OWNER') return '/owner';
  if (role === 'PT') return '/pt';
  return '/member';
}
