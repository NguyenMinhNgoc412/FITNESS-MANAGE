import { roleRoute, sessionSchema } from './types';

describe('auth contract', () => {
  it.each([
    ['OWNER', '/owner'],
    ['PT', '/pt'],
    ['MEMBER', '/member'],
  ] as const)('đưa role %s tới đúng route', (role, route) => {
    expect(roleRoute(role)).toBe(route);
  });

  it('không hydrate session sai contract', () => {
    expect(sessionSchema.safeParse({ accessToken: '', refreshToken: 'token', user: { id: '1', role: 'STAFF' } }).success).toBe(false);
  });
});
