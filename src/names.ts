/** Antelope account shape used by the other labs. eosio::name is stricter; this is the preview. */
export const NAME = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z1-5.]{1,12}$/;

export function account(value: string, label: string): string | null {
  if (!NAME.test(value)) return `${label} is not an account`;
  return null;
}

/** Decimal uint64 with no leading zero. JavaScript Number is not used. */
export function uint64(value: string): bigint | null {
  if (!/^[1-9][0-9]{0,19}$/.test(value)) return null;
  const n = BigInt(value);
  if (n > 18446744073709551615n) return null;
  return n;
}
