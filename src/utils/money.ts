// Amounts are fixed-scale decimal strings (NUMERIC(19,4) in the DB). Comparing or
// subtracting them via Number() would risk float precision loss for large values,
// so these operate on scaled BigInts instead.
const SCALE = 4;

function toMinorUnits(value: string): bigint {
  const [intPart, fracPart = ""] = value.split(".");
  const paddedFrac = (fracPart + "0".repeat(SCALE)).slice(0, SCALE);
  return BigInt(intPart) * 10n ** BigInt(SCALE) + BigInt(paddedFrac);
}

function fromMinorUnits(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const digits = abs.toString().padStart(SCALE + 1, "0");
  const intPart = digits.slice(0, -SCALE);
  const fracPart = digits.slice(-SCALE);
  return `${negative ? "-" : ""}${intPart}.${fracPart}`;
}

export function compareAmounts(a: string, b: string): number {
  const diff = toMinorUnits(a) - toMinorUnits(b);
  return diff === 0n ? 0 : diff > 0n ? 1 : -1;
}

export function subtractAmounts(a: string, b: string): string {
  return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
}
