import { create } from 'zustand';
import { ProfilePreferences, readProfilePreferences, writeProfilePreferences } from '../features/profile/preferences';

type State = ProfilePreferences & {
  userId?: string;
  loading: boolean;
  load: (userId: string) => Promise<void>;
  setAvatar: (avatarUri?: string) => Promise<void>;
};

export const useProfileStore = create<State>((set, get) => ({
  loading: false,
  load: async (userId) => {
    set({ loading: true, userId });
    const preferences = await readProfilePreferences(userId);
    set({ ...preferences, loading: false });
  },
  setAvatar: async (avatarUri) => {
    const { userId } = get();
    if (!userId) return;
    await writeProfilePreferences(userId, { avatarUri });
    set({ avatarUri });
  },
}));
