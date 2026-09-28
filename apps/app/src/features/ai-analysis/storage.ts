import * as SQLite from 'expo-sqlite';
import { Analysis } from './algorithm';
export type LocalSession = { id: string; member_id: string; exercise_type: string; video_uri: string; status: string; analysis_json: string | null; created_at: string; updated_at: string };
const databases = new Map<string, Promise<SQLite.SQLiteDatabase>>();
function database(memberId: string) {
  if (!/^[a-f0-9]{24}$/.test(memberId)) throw new Error('Tài khoản không hợp lệ.');
  if (!databases.has(memberId)) databases.set(memberId, (async () => {
    const db = await SQLite.openDatabaseAsync('fitness-ai-' + memberId + '.db');
    await db.execAsync("PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS local_ai_sessions (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, exercise_type TEXT NOT NULL, video_uri TEXT NOT NULL, status TEXT NOT NULL, analysis_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL); PRAGMA user_version = 1;");
    await db.runAsync("UPDATE local_ai_sessions SET status = 'FAILED' WHERE status = 'PROCESSING'");
    return db;
  })().catch(error => { databases.delete(memberId); throw error; }));
  return databases.get(memberId)!;
}
export async function listSessions(memberId: string) { return (await database(memberId)).getAllAsync<LocalSession>('SELECT * FROM local_ai_sessions WHERE member_id = ? ORDER BY created_at DESC', memberId); }
export async function addSession(memberId: string, id: string, uri: string) {
  const now = new Date().toISOString();
  await (await database(memberId)).runAsync('INSERT INTO local_ai_sessions (id, member_id, exercise_type, video_uri, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', id, memberId, 'SQUAT', uri, 'PENDING', now, now);
}
export async function updateSession(memberId: string, id: string, status: string, result?: Analysis) {
  await (await database(memberId)).runAsync('UPDATE local_ai_sessions SET status = ?, analysis_json = ?, updated_at = ? WHERE id = ? AND member_id = ?', status, result ? JSON.stringify(result) : null, new Date().toISOString(), id, memberId);
}
export async function removeSession(memberId: string, id: string) {
  await (await database(memberId)).runAsync('DELETE FROM local_ai_sessions WHERE id = ? AND member_id = ?', id, memberId);
}
