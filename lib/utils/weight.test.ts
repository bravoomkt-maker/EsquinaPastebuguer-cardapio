import { describe, expect, it } from "vitest";
import { computeWeightValue, isValidWeight } from "./weight";

describe("computeWeightValue", () => {
  const pricePerKg = 54.0;

  it.each([
    [100, 5.4],
    [250, 13.5],
    [300, 16.2],
    [350, 18.9],
    [500, 27.0],
    [750, 40.5],
    [1000, 54.0],
  ])("%i g a R$54,00/kg = R$%s", (grams, expected) => {
    expect(computeWeightValue(grams, pricePerKg)).toBeCloseTo(expected, 2);
  });

  it("retorna 0 para peso zero ou negativo", () => {
    expect(computeWeightValue(0, pricePerKg)).toBe(0);
    expect(computeWeightValue(-100, pricePerKg)).toBe(0);
  });

  it("arredonda corretamente em centavos", () => {
    // 333g a R$54/kg = 17.982 -> arredonda para 17.98
    expect(computeWeightValue(333, pricePerKg)).toBeCloseTo(17.98, 2);
  });
});

describe("isValidWeight", () => {
  it("rejeita peso zero, negativo ou fracionário", () => {
    expect(isValidWeight(0, 5000)).toBe(false);
    expect(isValidWeight(-50, 5000)).toBe(false);
    expect(isValidWeight(150.5, 5000)).toBe(false);
  });

  it("rejeita peso acima do máximo configurado", () => {
    expect(isValidWeight(2500, 2000)).toBe(false);
  });

  it("aceita peso inteiro positivo dentro do limite", () => {
    expect(isValidWeight(350, 2000)).toBe(true);
    expect(isValidWeight(1000, 2000)).toBe(true);
  });
});
