import { describe, expect, it } from "vitest";
import { posCartItemTotal, posCartSubtotal, type PosCartItem } from "./posCartStore";

function unitItem(overrides: Partial<PosCartItem> = {}): PosCartItem {
  return {
    lineId: "1",
    productId: "p1",
    name: "X-Burguer",
    saleType: "unit",
    quantity: 1,
    weightGrams: null,
    pricePerKg: null,
    unitPrice: 14,
    sizeLabel: null,
    secondProductId: null,
    notes: "",
    modifiers: [],
    imageUrl: null,
    categoryName: "Hambúrgueres",
    ...overrides,
  };
}

function weightItem(overrides: Partial<PosCartItem> = {}): PosCartItem {
  return {
    lineId: "2",
    productId: "acai",
    name: "Açaí na tigela",
    saleType: "weight",
    quantity: 1,
    weightGrams: 350,
    pricePerKg: 54,
    unitPrice: 54,
    sizeLabel: null,
    secondProductId: null,
    notes: "",
    modifiers: [],
    imageUrl: null,
    categoryName: "Açaí",
    ...overrides,
  };
}

describe("posCartItemTotal", () => {
  it("multiplica preço unitário pela quantidade", () => {
    expect(posCartItemTotal(unitItem({ unitPrice: 14, quantity: 2 }))).toBe(28);
  });

  it("calcula item por peso a partir de weightGrams x pricePerKg", () => {
    // 350g a R$54/kg = R$18,90 (mesmo exemplo do pedido de referência)
    expect(posCartItemTotal(weightItem({ weightGrams: 350, pricePerKg: 54 }))).toBeCloseTo(
      18.9,
      2
    );
  });

  it("venda de 1000g de açaí = preço cheio por kg", () => {
    expect(posCartItemTotal(weightItem({ weightGrams: 1000, pricePerKg: 54 }))).toBeCloseTo(
      54,
      2
    );
  });

  it("soma adicionais ao total do item, sem multiplicar pela quantidade do produto", () => {
    const item = unitItem({
      unitPrice: 14,
      quantity: 3,
      modifiers: [{ modifierId: "m1", name: "Bacon", price: 4, quantity: 1 }],
    });
    // 14*3 (produto) + 4*1 (adicional, uma vez por linha) = 46
    expect(posCartItemTotal(item)).toBe(46);
  });

  it("adicionais também entram no total de itens por peso", () => {
    const item = weightItem({
      weightGrams: 500,
      pricePerKg: 54,
      modifiers: [{ modifierId: "m1", name: "Granola", price: 2, quantity: 1 }],
    });
    // 500g a R$54/kg = 27.00 + 2.00 de adicional = 29.00
    expect(posCartItemTotal(item)).toBeCloseTo(29, 2);
  });
});

describe("posCartSubtotal", () => {
  it("soma o total de todas as linhas do carrinho", () => {
    const items = [
      unitItem({ unitPrice: 14, quantity: 2 }), // 28
      weightItem({ weightGrams: 350, pricePerKg: 54 }), // 18.90
    ];
    expect(posCartSubtotal(items)).toBeCloseTo(46.9, 2);
  });

  it("retorna 0 para carrinho vazio", () => {
    expect(posCartSubtotal([])).toBe(0);
  });
});
