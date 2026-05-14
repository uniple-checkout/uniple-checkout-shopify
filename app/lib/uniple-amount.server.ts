/**
 * JPYC amount 整数化 + 検証。
 *
 * EC-CUBE / WooCommerce plugin と同 logic 移植:
 * - "50" / "50.00" / 50 / 50.0 → 50 (int)
 * - "50.5" / "" / null / 非数値 → Error
 *
 * Shopify Order total は通貨小数桁 (= JPY=0、 USD=2 等) を含めた string で
 * 返ることがあるため、 入力前に shop currency=JPY 確認 + 整数 minor unit 化前提。
 */

export class InvalidJpycAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJpycAmountError";
  }
}

export function toIntegerJpyc(value: unknown): number {
  if (value === null || value === undefined || value === false || value === "") {
    throw new InvalidJpycAmountError("amountJpyc empty");
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new InvalidJpycAmountError("amountJpyc not finite");
    }
    if (!Number.isInteger(value)) {
      // 50.0 等の float 整数値は許容
      if (Math.floor(value) === value) {
        return Math.trunc(value);
      }
      throw new InvalidJpycAmountError(`amountJpyc not integer: ${value}`);
    }
    return value;
  }
  const s = String(value).trim();
  if (s === "") {
    throw new InvalidJpycAmountError("amountJpyc empty");
  }
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10);
  }
  const decimalZero = s.match(/^(\d+)\.0+$/);
  if (decimalZero) {
    return parseInt(decimalZero[1], 10);
  }
  throw new InvalidJpycAmountError(`amountJpyc not integer-compatible: ${s}`);
}
