export type CircuitBreakerOptions = {
  failureThreshold: number; // consecutive failures needed to open
  cooldownMs: number; // duration to stay OPEN before transitioning to HALF_OPEN
  halfOpenMaxCalls?: number; // concurrent trial calls allowed in HALF_OPEN
  onStateChange?: (state: 'CLOSED' | 'OPEN' | 'HALF_OPEN') => void;
};
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export class CircuitBreaker {
  private state: State = 'CLOSED';
  private consecutiveFailures = 0;
  private lastOpenedAt = 0;
  private halfOpenInFlight = 0;
  constructor(private opts: CircuitBreakerOptions) {}
  private setState(next: State) {
    if (this.state !== next) {
      this.state = next;
      this.opts.onStateChange?.(next);
      if (next === 'OPEN') {
        this.lastOpenedAt = Date.now();
      }
      if (next === 'CLOSED') {
        this.consecutiveFailures = 0;
      }
      if (next !== 'HALF_OPEN') {
        this.halfOpenInFlight = 0;
      }
    }
  }
  private canPass(): boolean {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now - this.lastOpenedAt >= this.opts.cooldownMs) {
        this.setState('HALF_OPEN');
      } else {
        return false;
      }
    }
    if (this.state === 'HALF_OPEN') {
      const max = this.opts.halfOpenMaxCalls ?? 1;
      return this.halfOpenInFlight < max;
    }
    // CLOSED
    return true;
  }
  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canPass()) {
      throw new Error('CircuitBreaker: OPEN');
    }
    if (this.state === 'HALF_OPEN') {
      this.halfOpenInFlight++;
    }
    try {
      const result = await fn();
      // On success:
      if (this.state === 'HALF_OPEN') {
        // A successful probe closes the circuit
        this.setState('CLOSED');
      } else {
        // In CLOSED, reset failure counter on success
        this.consecutiveFailures = 0;
      }
      return result;
    } catch (err) {
      // On failure:
      if (this.state === 'HALF_OPEN') {
        // Probe failed, go back to OPEN
        this.setState('OPEN');
      } else {
        // In CLOSED, count consecutive failures
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.opts.failureThreshold) {
          this.setState('OPEN');
        }
      }
      throw err;
    } finally {
      if (this.state === 'HALF_OPEN') {
        // Decrement in-flight count for HALF_OPEN calls
        this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
      }
    }
  }
  getState(): State {
    return this.state;
  }
}
