import { KitchenBoard } from "@/components/cozinha/KitchenBoard";
import { createClient } from "@/lib/supabase/server";
import type { KitchenOrder, KitchenOrderItem } from "@/components/cozinha/types";

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

export default async function CozinhaPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, order_type, table_number, customer_name, notes, status, pickup_at, created_at"
    )
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  const orderIds = (orders ?? []).map((o) => o.id);

  const { data: items } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("id, order_id, product_name, quantity, sale_type, weight_grams, notes")
        .in("order_id", orderIds)
    : { data: [] };

  const itemIds = (items ?? []).map((i) => i.id);

  const { data: modifiers } = itemIds.length
    ? await supabase
        .from("order_item_modifiers")
        .select("id, order_item_id, modifier_name, quantity")
        .in("order_item_id", itemIds)
    : { data: [] };

  const modifiersByItem = new Map<string, { name: string; quantity: number }[]>();
  for (const m of modifiers ?? []) {
    const list = modifiersByItem.get(m.order_item_id) ?? [];
    list.push({ name: m.modifier_name, quantity: m.quantity });
    modifiersByItem.set(m.order_item_id, list);
  }

  const itemsByOrder = new Map<string, KitchenOrderItem[]>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({
      id: item.id,
      productName: item.product_name,
      quantity: item.quantity,
      saleType: item.sale_type as "unit" | "weight",
      weightGrams: item.weight_grams,
      notes: item.notes,
      modifiers: modifiersByItem.get(item.id) ?? [],
    });
    itemsByOrder.set(item.order_id, list);
  }

  const kitchenOrders: KitchenOrder[] = (orders ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    orderType: order.order_type,
    tableNumber: order.table_number,
    customerName: order.customer_name,
    notes: order.notes,
    status: order.status as KitchenOrder["status"],
    pickupAt: order.pickup_at,
    createdAt: order.created_at,
    items: itemsByOrder.get(order.id) ?? [],
  }));

  return <KitchenBoard orders={kitchenOrders} />;
}
