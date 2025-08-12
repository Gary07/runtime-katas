export function longestSubstringKDistinct(
  s: string,
  k: number,
): { length: number; start: number; end: number } {
  if (k <= 0 || s.length === 0) return { length: 0, start: -1, end: -1 };
  let left = 0;
  let best = { length: 0, start: -1, end: -1 };
  const freq = new Map<string, number>();
  for (let right = 0; right < s.length; right++) {
    const chR = s[right];
    freq.set(chR, (freq.get(chR) ?? 0) + 1);
    while (freq.size > k) {
      const chL = s[left];
      const cnt = (freq.get(chL) ?? 0) - 1;
      if (cnt <= 0) freq.delete(chL);
      else freq.set(chL, cnt);
      left++;
    }
    const len = right - left + 1;
    if (len > best.length) {
      best = { length: len, start: left, end: right };
    }
  }
  return best;
}
