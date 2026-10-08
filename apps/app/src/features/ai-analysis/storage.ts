import * as SQLite from 'expo-sqlite';
import type { StoredAnalysis } from './automatic';
import { assertLocalStorageReady } from './storage-runtime';
export type LocalSession = { id: string; member_id: string; exercise_type: string; video_uri: string; status: string; analysis_json: string | null; created_at: string; updated_at: string };
const databases = new Map<string, Promise<SQLite.SQLiteDatabase>>();
async function openDatabase(memberId: string) {
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const opening = SQLite.openDatabaseAsync('fitness-ai-' + memberId + '.db', { useNewConnection: true });
  void opening.then(db => { if (timedOut) void db.closeAsync().catch(() => undefined); }, () => undefined);
  try {
    return await Promise.race([opening, new Promise<never>((_, reject) => {
      timer = setTimeout(() => { timedOut = true; reject(new Error('Không mở được bộ nhớ AI. Tải lại trang và thử lại.')); }, 15000);
    })]);
  } finally { clearTimeout(timer); }
}
function database(memberId: string) {
  assertLocalStorageReady();
  if (!/^[a-f0-9]{24}$/.test(memberId)) throw new Error('Tài khoản không hợp lệ.');
  if (!databases.has(memberId)) databases.set(memberId, (async () => {
    const db = await openDatabase(memberId);
    await db.execAsync("PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS local_ai_sessions (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, exercise_type TEXT NOT NULL, video_uri TEXT NOT NULL, status TEXT NOT NULL, analysis_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS local_ai_results (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, member_id TEXT NOT NULL, analysis_json TEXT NOT NULL, created_at TEXT NOT NULL); INSERT INTO local_ai_results (session_id, member_id, analysis_json, created_at) SELECT s.id, s.member_id, s.analysis_json, s.updated_at FROM local_ai_sessions s WHERE s.analysis_json IS NOT NULL AND NOT EXISTS (SELECT 1 FROM local_ai_results r WHERE r.session_id = s.id AND r.member_id = s.member_id); PRAGMA user_version = 2;");
    await db.runAsync("UPDATE local_ai_sessions SET status = 'FAILED' WHERE status = 'PROCESSING'");
    return db;
  })().catch(error => { databases.delete(memberId); throw error; }));
  return databases.get(memberId)!;
}
export async function listSessions(memberId: string) { return (await database(memberId)).getAllAsync<LocalSession>('SELECT * FROM local_ai_sessions WHERE member_id = ? ORDER BY created_at DESC', memberId); }
export async function addSession(memberId: string, id: string, uri: string) {
  const now = new Date().toISOString();
  await (await database(memberId)).runAsync('INSERT INTO local_ai_sessions (id, member_id, exercise_type, video_uri, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', id, memberId, 'AUTO', uri, 'PENDING', now, now);
}
export async function updateSession(memberId: string, id: string, status: string, result?: StoredAnalysis) {
  const db = await database(memberId), now = new Date().toISOString(), json = result ? JSON.stringify(result) : null;
  await db.withTransactionAsync(async () => {
    if (json) await db.runAsync('INSERT INTO local_ai_results (session_id, member_id, analysis_json, created_at) SELECT id, member_id, ?, ? FROM local_ai_sessions WHERE id = ? AND member_id = ?', json, now, id, memberId);
    await db.runAsync('UPDATE local_ai_sessions SET status = ?, analysis_json = COALESCE(?, analysis_json), exercise_type = COALESCE(?, exercise_type), updated_at = ? WHERE id = ? AND member_id = ?', status, json, result?.exercise ?? null, now, id, memberId);
  });
}
export async function removeSession(memberId: string, id: string) {
  const db = await database(memberId);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM local_ai_results WHERE session_id = ? AND member_id = ?', id, memberId);
    await db.runAsync('DELETE FROM local_ai_sessions WHERE id = ? AND member_id = ?', id, memberId);
  });
}
