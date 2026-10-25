/** Small numeric helpers used by the scoring engine. */

export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: readonly number[]) => (xs.length ? sum(xs) / xs.length : 0);
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const round = (x: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
};

export function median(xs: readonly number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Weighted median: the value where cumulative weight first reaches half. */
export function stdDev(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(sum(xs.map((x) => (x - m) ** 2)) / (xs.length - 1));
}

/** Weighted least squares slope of y over x = 0..n-1, plus intercept. */
/** Linear interpolation of points between two anchors, clamped. */
export function scale(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x1 === x0) return y1;
  const t = clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + t * (y1 - y0);
}

/** Score bands: A from 740, B from 670, C from 600, D from 530, else E. */
export function bandFor(score: number): "A" | "B" | "C" | "D" | "E" {
  if (score >= 740) return "A";
  if (score >= 670) return "B";
  if (score >= 600) return "C";
  if (score >= 530) return "D";
  return "E";
}
