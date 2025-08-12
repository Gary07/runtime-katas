import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry } from '../utils/retry';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, 'setTimeout');
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('succeeds without retries', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const p = retry(fn, { retries: 3, baseMs: 100, jitter: 'none' });
    await expect(p).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce('ok');

    const promise = retry(fn, { retries: 3, baseMs: 100, jitter: 'full' });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('propagates last error after exhausting retries', async () => {
    const err = new Error('boom');
    const fn = vi.fn().mockRejectedValue(err);
    const promise = retry(fn, { retries: 2, baseMs: 50 });

    // Ensure timers advance fully, then assert rejection
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow('boom');

    // Explicit cleanup here so no pending fake timers remain when the test ends
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
