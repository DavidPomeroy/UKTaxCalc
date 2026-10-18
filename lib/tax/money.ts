/** Money helpers. All internal maths is done in integer pence to avoid
 * floating-point drift. Convert to pounds only at the presentation layer. */

export const PENCE_PER_POUND = 100;

/** Convert pounds to pence (rounded to nearest penny). */
export function toPence(pounds: number): number {
  return Math.round(pounds * PENCE_PER_POUND);
}

/** Convert pence to pounds. */
export function toPounds(pence: number): number {
  return pence / PENCE_PER_POUND;
}

/** Round a raw pound value to the nearest penny in pence. */
export function roundPence(value: number): number {
  return Math.round(value);
}

/** Clamp value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Positive part: max(value, 0). */
export function positive(value: number): number {
  return value > 0 ? value : 0;
}

/** Format pence as a £ string. */
export function formatPounds(
  pence: number,
  options: { decimals?: number; sign?: boolean } = {}
): string {
  const { decimals = 2, sign = false } = options;
  const pounds = toPounds(pence);
  const abs = Math.abs(pounds);
  const str = abs.toFixed(decimals);
  const prefix = pence < 0 ? "-" : sign && pence > 0 ? "+" : "";
  return `£${prefix}${str}`;
}

/** Sum an array of pence values. */
export function sumPence(...values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
