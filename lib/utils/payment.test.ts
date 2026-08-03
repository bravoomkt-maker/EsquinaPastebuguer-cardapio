import { describe, expect, it } from "vitest";
import { calculateChange, isSufficientCashPayment } from "./payment";

describe("calculateChange", () => {
  it("calcula o troco corretamente", () => {
    expect(calculateChange(50, 37.5)).toBeCloseTo(12.5, 2);
    expect(calculateChange(100, 100)).toBe(0);
  });

  it("nunca retorna troco negativo", () => {
    expect(calculateChange(10, 20)).toBe(0);
  });
});

describe("isSufficientCashPayment", () => {
  it("aceita valor recebido igual ou maior que o devido", () => {
    expect(isSufficientCashPayment(50, 50)).toBe(true);
    expect(isSufficientCashPayment(60, 50)).toBe(true);
  });

  it("rejeita valor recebido menor que o devido", () => {
    expect(isSufficientCashPayment(40, 50)).toBe(false);
  });
});
