jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
import * as SQLite from 'expo-sqlite';
import { addSession, listSessions, updateSession, removeSession } from './storage';
import { analyzeAutomatically } from './automatic';

describe('SQLite worker initialization failure', () => {
  afterEach(() => jest.useRealTimers());
  it('rejects a stalled worker, closes a late connection and allows a fresh retry', async () => {
    jest.useFakeTimers();
    const memberId = 'a'.repeat(24);
    let finishOpening!: (db: SQLite.SQLiteDatabase) => void;
    const opening = new Promise<SQLite.SQLiteDatabase>(resolve => { finishOpening = resolve; });
    jest.mocked(SQLite.openDatabaseAsync).mockReturnValueOnce(opening);
    const pending = listSessions(memberId);
    const failure = expect(pending).rejects.toThrow('Không mở được bộ nhớ AI');
    await jest.advanceTimersByTimeAsync(15000);
    await failure;
    const late = { closeAsync: jest.fn().mockResolvedValue(undefined) } as unknown as SQLite.SQLiteDatabase;
    finishOpening(late);
    await Promise.resolve();
    expect(late.closeAsync).toHaveBeenCalledTimes(1);
    const ready = { execAsync: jest.fn().mockResolvedValue(undefined), runAsync: jest.fn().mockResolvedValue({}), getAllAsync: jest.fn().mockResolvedValue([]) } as unknown as SQLite.SQLiteDatabase;
    jest.mocked(SQLite.openDatabaseAsync).mockResolvedValueOnce(ready);
    await expect(listSessions(memberId)).resolves.toEqual([]);
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(2);
  });
  it('initializes AUTO sessions and appends results atomically without erasing on failure', async () => {
    const db = { execAsync: jest.fn().mockResolvedValue(undefined), runAsync: jest.fn().mockResolvedValue({}), withTransactionAsync: jest.fn(async action => action()) };
    jest.mocked(SQLite.openDatabaseAsync).mockResolvedValueOnce(db as unknown as SQLite.SQLiteDatabase);
    const member = 'b'.repeat(24);
    await addSession(member, 'session-test', 'local-only-uri');
    expect(db.execAsync.mock.calls[0][0]).toContain('PRAGMA user_version = 2');
    expect(db.runAsync.mock.calls.at(-1)?.slice(1, 5)).toEqual(['session-test', member, 'AUTO', 'local-only-uri']);
    db.runAsync.mockClear();
    await updateSession(member, 'session-test', 'COMPLETED', analyzeAutomatically([]));
    expect(db.runAsync.mock.calls[0][0]).toContain('INSERT INTO local_ai_results');
    expect(db.runAsync.mock.calls[1][0]).toContain('COALESCE(?, analysis_json)');
    db.runAsync.mockClear();
    await updateSession(member, 'session-test', 'FAILED');
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync.mock.calls[0][2]).toBeNull();
    db.runAsync.mockClear();
    await removeSession(member, 'session-test');
    expect(db.runAsync.mock.calls[0]).toEqual(['DELETE FROM local_ai_results WHERE session_id = ? AND member_id = ?', 'session-test', member]);
    expect(db.runAsync.mock.calls[1][0]).toContain('DELETE FROM local_ai_sessions');
  });
});
