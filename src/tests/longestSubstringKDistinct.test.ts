import { describe, it, expect } from 'vitest';
import { longestSubstringKDistinct } from '../dsa/longestSubstringKDistinct';
describe('longestSubstringKDistinct', () => {
  it('handles basic case', () => {
    const res = longestSubstringKDistinct('eceba', 2);
    expect(res.length).toBe(3);
    expect(res.start).toBe(0);
    expect(res.end).toBe(2);
  });
  it('returns full length when possible', () => {
    const res = longestSubstringKDistinct('aaabbcc', 2);
    expect(res.length).toBe(5);
  });
  it('edge cases', () => {
    expect(longestSubstringKDistinct('', 2).length).toBe(0);
    expect(longestSubstringKDistinct('abc', 0).length).toBe(0);
    const r = longestSubstringKDistinct('a', 1);
    expect(r.length).toBe(1);
    expect(r.start).toBe(0);
    expect(r.end).toBe(0);
  });
});
