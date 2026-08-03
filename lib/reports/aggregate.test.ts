import { describe, expect, it } from "vitest";
import { buildReport } from "./aggregate";
import type { Order, OrderItem } from "@/lib/types";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: overrides.id ?? "order-1",
    order_number: 1,
    customer_name: "Cliente balcão",
    customer_phone: "",
    street: null,
    number: null,
    complement: null,
    reference_point: null,
    neighborhood_id: null,
    payment_method: "dinheiro",
    change_for: null,
    notes: null,
    subtotal: 20,
    delivery_fee: 0,
    discount: 0,
    total: 20,
    status: "delivered",
    order_type: "balcao",
    table_number: null,
    pickup_at: null,
    source: "pdv",
    created_by: null,
    cash_register_id: null,
    customer_id: null,
    is_open_tab: false,
    created_at: "2026-08-03T15:00:00.000Z",
    ...overrides,
  };
}

function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: overrides.id ?? "item-1",
    order_id: overrides.order_id ?? "order-1",
    product_id: "product-1",
    product_name: "X-Burguer",
    quantity: 1,
    unit_price: 14,
    notes: null,
    subtotal: 14,
    sale_type: "unit",
    weight_grams: null,
    price_per_kg: null,
    ...overrides,
  };
}

describe("buildReport", () => {
  it("ignora pedidos cancelados no faturamento, mas conta em cancelledCount", () => {
    const orders = [
      makeOrder({ id: "o1", total: 20, status: "delivered" }),
      makeOrder({ id: "o2", total: 999, status: "cancelled" }),
    ];

    const report = buildReport({ orders, items: [], payments: [], profileNameById: {} });

    expect(report.revenue).toBe(20);
    expect(report.orderCount).toBe(1);
    expect(report.cancelledCount).toBe(1);
  });

  it("calcula ticket médio corretamente", () => {
    const orders = [
      makeOrder({ id: "o1", total: 10 }),
      makeOrder({ id: "o2", total: 30 }),
    ];

    const report = buildReport({ orders, items: [], payments: [], profileNameById: {} });

    expect(report.averageTicket).toBe(20);
  });

  it("soma peso e faturamento de itens vendidos por peso", () => {
    const orders = [makeOrder({ id: "o1" })];
    const items = [
      makeItem({
        order_id: "o1",
        sale_type: "weight",
        weight_grams: 350,
        price_per_kg: 54,
        subtotal: 18.9,
        quantity: 1,
      }),
    ];

    const report = buildReport({ orders, items, payments: [], profileNameById: {} });

    expect(report.weightSoldGrams).toBe(350);
    expect(report.weightRevenue).toBeCloseTo(18.9, 2);
  });

  it("soma descontos e taxas de entrega apenas de pedidos válidos", () => {
    const orders = [
      makeOrder({ id: "o1", discount: 5, delivery_fee: 8 }),
      makeOrder({ id: "o2", discount: 100, delivery_fee: 100, status: "cancelled" }),
    ];

    const report = buildReport({ orders, items: [], payments: [], profileNameById: {} });

    expect(report.discountsTotal).toBe(5);
    expect(report.deliveryFeesTotal).toBe(8);
  });
});
