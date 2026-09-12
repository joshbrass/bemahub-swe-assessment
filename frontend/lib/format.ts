/**
 * WORKED EXAMPLE - money and nullable formatting.
 *
 * Money arrives in MINOR units as an integer. Never store or arithmetic money
 * as a float; format only at the edge.
 */
export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

/**
 * `null` means "not known" and must NOT render as 0.
 * A real 0 is a measurement and must render as 0.
 */
export function formatNullableNumber(value: number | null): string {
  return value === null ? "—" : String(value);
}
