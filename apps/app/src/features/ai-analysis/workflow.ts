export function analysisStep(session: { status: string; analysis_json: string | null } | undefined, analyzing: boolean) {
  if (analyzing) return 2;
  if (!session) return 1;
  return session.status === 'COMPLETED' && session.analysis_json ? 3 : 1;
}

// Share the same lock across import, analysis and deletion, including confirmation.
export async function runExclusive(lock: { current: boolean }, action: () => Promise<void>) {
  if (lock.current) return;
  lock.current = true;
  try { await action(); }
  finally { lock.current = false; }
}
