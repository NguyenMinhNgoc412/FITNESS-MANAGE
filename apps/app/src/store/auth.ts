import { create } from 'zustand';
import { readStoredSession, removeStoredSession, writeStoredSession } from '../features/auth/session-storage';
import { Session, sessionSchema } from '../features/auth/types';

type State = {
  session: Session | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAuthStore = create<State>((set) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await readStoredSession();
      const parsed = raw ? sessionSchema.safeParse(JSON.parse(raw)) : null;
      if (parsed?.success) set({ session: parsed.data });
      else if (raw) await removeStoredSession();
    } catch {
      await removeStoredSession().catch(() => undefined);
    } finally {
      set({ hydrated: true });
    }
  },
  setSession: async (session) => {
    const valid = sessionSchema.parse(session);
    await writeStoredSession(JSON.stringify(valid));
    set({ session: valid });
  },
  clear: async () => {
    await removeStoredSession();
    set({ session: null });
  },
}));
