import { analysisStep, runExclusive } from './workflow';

describe('AI session workflow regressions', () => {
  it('keeps a newly imported video at the video step when older sessions have results', () => {
    const old = { status: 'COMPLETED', analysis_json: '{}' };
    const current = { status: 'PENDING', analysis_json: null };
    expect(analysisStep(old, false)).toBe(3);
    expect(analysisStep(current, false)).toBe(1);
    expect(analysisStep(current, true)).toBe(2);
    expect(analysisStep({ status: 'FAILED', analysis_json: null }, false)).toBe(1);
    expect(analysisStep(undefined, false)).toBe(1);
  });

  it('blocks duplicate deletion and competing work while confirmation is pending', async () => {
    const lock = { current: false };
    let confirm!: () => void;
    const confirmation = new Promise<void>(resolve => { confirm = resolve; });
    const deleteVideo = jest.fn();
    const deletion = runExclusive(lock, async () => { await confirmation; deleteVideo(); });
    const competingWork = jest.fn();
    await runExclusive(lock, competingWork);
    await runExclusive(lock, deleteVideo);
    expect(competingWork).not.toHaveBeenCalled();
    expect(deleteVideo).not.toHaveBeenCalled();
    confirm(); await deletion;
    expect(deleteVideo).toHaveBeenCalledTimes(1);
    await runExclusive(lock, competingWork);
    expect(competingWork).toHaveBeenCalledTimes(1);
  });

  it('releases the lock after cancellation or storage failure so retry is possible', async () => {
    const lock = { current: false };
    await runExclusive(lock, async () => { /* user cancels confirmation */ });
    expect(lock.current).toBe(false);
    await expect(runExclusive(lock, async () => { throw new Error('Storage unavailable'); })).rejects.toThrow('Storage unavailable');
    const retry = jest.fn();
    await runExclusive(lock, retry);
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
