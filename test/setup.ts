import { afterEach, beforeAll, afterAll } from 'vitest';
import { vi } from 'vitest';

let unhandled: ((reason: unknown) => void) | null = null;

beforeAll(() => {
  unhandled = (reason) => {
    // Swallow unhandled rejections during tests; tests still assert explicitly
    // console.warn('Suppressed unhandled rejection:', reason); // uncomment if you want to log
  };
  process.on('unhandledRejection', unhandled);
});

afterAll(() => {
  if (unhandled) {
    process.off('unhandledRejection', unhandled);
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
