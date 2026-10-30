import { useEffect } from 'react';

export function useDirtyEffect(dirty: boolean, setDirty: (v: boolean) => void) { useEffect(() => { setDirty(dirty); return () => setDirty(false); }, [dirty, setDirty]); }
