import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { errorMessage } from '../lib/http';

export function useLoad<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    if (!url) { setData(null); setError(''); setLoading(false); return; }
    setLoading(true); setError('');
    try { const result = await api.get<T>(url); if (current === generation.current) setData(result.data); }
    catch (e) { if (current === generation.current) { setData(null); setError(errorMessage(e)); } }
    finally { if (current === generation.current) setLoading(false); }
  }, [url]);
  useEffect(() => { setData(null); void reload(); return () => { generation.current++; }; }, [reload]);
  return { data, loading, error, reload };
}
