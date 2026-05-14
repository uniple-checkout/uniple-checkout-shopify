import { describe, expect, it } from "vitest";
import { InvalidJpycAmountError, toIntegerJpyc } from "../uniple-amount.server";

describe("toIntegerJpyc", () => {
  it("accepts integer string", () => {
    expect(toIntegerJpyc("50")).toBe(50);
    expect(toIntegerJpyc("0")).toBe(0);
    expect(toIntegerJpyc("123456")).toBe(123456);
  });
  it("accepts decimal-zero suffix string", () => {
    expect(toIntegerJpyc("50.0")).toBe(50);
    expect(toIntegerJpyc("50.00")).toBe(50);
    expect(toIntegerJpyc("50.000")).toBe(50);
  });
  it("accepts numeric types", () => {
    expect(toIntegerJpyc(50)).toBe(50);
    expect(toIntegerJpyc(50.0)).toBe(50);
  });
  it("rejects decimal non-zero", () => {
    expect(() => toIntegerJpyc("50.5")).toThrow(InvalidJpycAmountError);
    expect(() => toIntegerJpyc(50.5)).toThrow(InvalidJpycAmountError);
  });
  it("rejects empty", () => {
    expect(() => toIntegerJpyc("")).toThrow(InvalidJpycAmountError);
    expect(() => toIntegerJpyc(null)).toThrow(InvalidJpycAmountError);
    expect(() => toIntegerJpyc(undefined)).toThrow(InvalidJpycAmountError);
    expect(() => toIntegerJpyc(false)).toThrow(InvalidJpycAmountError);
  });
  it("rejects non-numeric", () => {
    expect(() => toIntegerJpyc("abc")).toThrow(InvalidJpycAmountError);
    expect(() => toIntegerJpyc(Infinity)).toThrow(InvalidJpycAmountError);
    expect(() => toIntegerJpyc(NaN)).toThrow(InvalidJpycAmountError);
  });
});
