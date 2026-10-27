/** Display whole BERI only; never round a balance up or change payment precision. */
export function wholeBounty(value: string | number): string {
  if (typeof value === "number") return Math.trunc(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const whole = value.replace(/,/g, "").split(".")[0];
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function wholeRawBalance(raw: bigint, decimals: number): string {
  return wholeBounty((raw / (10n ** BigInt(decimals))).toString());
}
