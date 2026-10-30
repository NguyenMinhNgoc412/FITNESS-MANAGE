import { createContext, useContext, useEffect, useId } from 'react';

export const DetailState = createContext<{ busy: boolean; setPending: (id: string, pending: boolean) => void } | null>(null);
export const useDetailLocked = () => useContext(DetailState)?.busy ?? false;
export function useDetailPending(pending: boolean) {
  const id = useId(), setPending = useContext(DetailState)?.setPending;
  useEffect(() => { setPending?.(id, pending); return () => setPending?.(id, false); }, [id, pending, setPending]);
}
