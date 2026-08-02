import { OrdersTable } from "@/components/admin/OrdersTable";
import { createClient } from "@/lib/supabase/server";
import type { Neighborhood, Order, OrderItem } from "@/lib/types";

export default async function PedidosPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!orders || orders.length === 0) {
    return <OrdersTable orders={[]} items={[]} neighborhoods={[]} />;
  }

  const orderIds = orders.map((order) => order.id);
  const neighborhoodIds = [
    ...new Set(orders.map((order) => order.neighborhood_id)),
  ];

  const [{ data: items }, { data: neighborhoods }] = await Promise.all([
    supabase.from("order_items").select("*").in("order_id", orderIds),
    supabase.from("neighborhoods").select("*").in("id", neighborhoodIds),
  ]);

  return (
    <OrdersTable
      orders={orders as Order[]}
      items={(items ?? []) as OrderItem[]}
      neighborhoods={(neighborhoods ?? []) as Neighborhood[]}
    />
  );
}
