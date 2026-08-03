import { hourInFortaleza } from "@/lib/utils/date";
import { ORDER_TYPE_LABELS, type Order, type OrderItem, type OrderType } from "@/lib/types";

export interface ReportPayment {
  order_id: string;
  amount: number;
  payment_method_name: string;
}

export interface ReportInput {
  orders: Order[];
  items: OrderItem[];
  payments: ReportPayment[];
  profileNameById: Record<string, string>;
}

export interface ReportResult {
  revenue: number;
  orderCount: number;
  averageTicket: number;
  cancelledCount: number;
  discountsTotal: number;
  deliveryFeesTotal: number;
  salesByOrderType: { type: string; label: string; count: number; total: number }[];
  salesByPaymentMethod: { name: string; total: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  bottomProducts: { name: string; revenue: number; quantity: number }[];
  weightSoldGrams: number;
  weightRevenue: number;
  ordersByHour: { hour: number; count: number }[];
  salesByEmployee: { name: string; total: number }[];
}

export function buildReport(input: ReportInput): ReportResult {
  const { orders, items, payments, profileNameById } = input;

  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const validOrderIds = new Set(validOrders.map((o) => o.id));
  const validItems = items.filter((i) => validOrderIds.has(i.order_id));

  const revenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = validOrders.length;
  const averageTicket = orderCount > 0 ? revenue / orderCount : 0;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const discountsTotal = validOrders.reduce((sum, o) => sum + o.discount, 0);
  const deliveryFeesTotal = validOrders.reduce((sum, o) => sum + o.delivery_fee, 0);

  const orderTypeTotals = new Map<string, { count: number; total: number }>();
  for (const order of validOrders) {
    const current = orderTypeTotals.get(order.order_type) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += order.total;
    orderTypeTotals.set(order.order_type, current);
  }
  const salesByOrderType = Array.from(orderTypeTotals.entries()).map(([type, v]) => ({
    type,
    label: ORDER_TYPE_LABELS[type as OrderType] ?? type,
    ...v,
  }));

  const paymentTotals = new Map<string, number>();
  for (const payment of payments) {
    if (!validOrderIds.has(payment.order_id)) continue;
    paymentTotals.set(
      payment.payment_method_name,
      (paymentTotals.get(payment.payment_method_name) ?? 0) + payment.amount
    );
  }
  const salesByPaymentMethod = Array.from(paymentTotals.entries()).map(([name, total]) => ({
    name,
    total,
  }));

  const productTotals = new Map<string, { revenue: number; quantity: number }>();
  for (const item of validItems) {
    const current = productTotals.get(item.product_name) ?? { revenue: 0, quantity: 0 };
    current.revenue += item.subtotal;
    current.quantity += item.sale_type === "weight" ? 0 : item.quantity;
    productTotals.set(item.product_name, current);
  }
  const productsSorted = Array.from(productTotals.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
  const topProducts = productsSorted.slice(0, 10);
  const bottomProducts = productsSorted.slice(-10).reverse();

  const weightItems = validItems.filter((i) => i.sale_type === "weight");
  const weightSoldGrams = weightItems.reduce((sum, i) => sum + (i.weight_grams ?? 0), 0);
  const weightRevenue = weightItems.reduce((sum, i) => sum + i.subtotal, 0);

  const hourTotals = new Map<number, number>();
  for (const order of validOrders) {
    const hour = hourInFortaleza(order.created_at);
    hourTotals.set(hour, (hourTotals.get(hour) ?? 0) + 1);
  }
  const ordersByHour = Array.from(hourTotals.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);

  const employeeTotals = new Map<string, number>();
  for (const order of validOrders) {
    if (order.source !== "pdv" || !order.created_by) continue;
    const name = profileNameById[order.created_by] ?? "Sem nome";
    employeeTotals.set(name, (employeeTotals.get(name) ?? 0) + order.total);
  }
  const salesByEmployee = Array.from(employeeTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    revenue,
    orderCount,
    averageTicket,
    cancelledCount,
    discountsTotal,
    deliveryFeesTotal,
    salesByOrderType,
    salesByPaymentMethod,
    topProducts,
    bottomProducts,
    weightSoldGrams,
    weightRevenue,
    ordersByHour,
    salesByEmployee,
  };
}
