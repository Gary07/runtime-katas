export type RetryOptions = {
  retries: number; // total attempts = retries + 1
  baseMs?: number; // base delay in ms for backoff (default 100)
  factor?: number; // exponential factor (default 2)
  jitter?: 'none' | 'full' | 'equal'; // jitter strategy
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void | Promise<void>;
};
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
function computeDelay(
  attempt: number,
  baseMs: number,
  factor: number,
  jitter: RetryOptions['jitter'],
): number {
  const raw = baseMs * Math.pow(factor, attempt);
  if (jitter === 'none' || !jitter) return raw;
  const rand = Math.random();
  if (jitter === 'full') return Math.floor(rand * raw);
  const half = raw / 2;
  return Math.floor(half + rand * half);
}
export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const { retries, baseMs = 100, factor = 2, jitter = 'full', onRetry } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const delay = computeDelay(attempt, baseMs, factor, jitter);
      if (onRetry) await onRetry(attempt + 1, err, delay);
      await sleep(delay);
    }
  }
  throw lastErr;
}
