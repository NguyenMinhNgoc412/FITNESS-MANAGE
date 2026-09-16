import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Role, roleRoute } from './features/auth/types';
import { useAuthStore } from './store/auth';

export function useRoleGuard(role: Role) {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace('/login');
    else if (session.user.role !== role) router.replace(roleRoute(session.user.role));
  }, [hydrated, role, router, session]);
  return hydrated && session?.user.role === role;
}

export function useAuthGuard() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  useEffect(() => {
    if (hydrated && !session) router.replace('/login');
  }, [hydrated, router, session]);
  return hydrated ? session : null;
}
