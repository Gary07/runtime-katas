import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../utils/circuitBreaker';
describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });
  it('stays CLOSED on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 });
    await expect(cb.exec(async () => 'ok')).resolves.toBe('ok');
    expect(cb.getState()).toBe('CLOSED');
  });
  it('opens after threshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 });
    await expect(
      cb.exec(async () => {
        throw new Error('x');
      }),
    ).rejects.toThrow();
    await expect(
      cb.exec(async () => {
        throw new Error('y');
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');
  });
  it('blocks calls while OPEN, then allows half-open probe after cooldown', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, halfOpenMaxCalls: 1 });
    await expect(
      cb.exec(async () => {
        throw new Error('x');
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');
    await expect(cb.exec(async () => 'ok')).rejects.toThrow(/OPEN/);
    vi.advanceTimersByTime(1000);
    await expect(cb.exec(async () => 'ok')).resolves.toBe('ok');
    expect(cb.getState()).toBe('CLOSED');
  });
  it('on failure in HALF_OPEN goes back to OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    await expect(
      cb.exec(async () => {
        throw new Error('x');
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');
    vi.advanceTimersByTime(1000);
    await expect(
      cb.exec(async () => {
        throw new Error('probe');
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe('OPEN');
  });
});
