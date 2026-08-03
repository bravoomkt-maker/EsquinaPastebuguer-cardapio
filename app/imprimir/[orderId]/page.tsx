import { notFound } from "next/navigation";
import { PrintReceipt, type PaymentWithMethod } from "@/components/print/PrintReceipt";
import { createClient } from "@/lib/supabase/server";
import type { OrderItemModifier } from "@/lib/types";

export default async function ImprimirPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { orderId } = await params;
  const { tipo } = await searchParams;
  const kind = tipo === "comprovante" ? "comprovante" : "comanda";

  const supabase = await createClient();

  const [
    { data: order },
    { data: items },
    { data: storeSettings },
    { data: printerSettings },
  ] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("id", { ascending: true }),
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("printer_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (!order) notFound();

  const itemIds = (items ?? []).map((i) => i.id);
  const { data: modifiers } = itemIds.length
    ? await supabase.from("order_item_modifiers").select("*").in("order_item_id", itemIds)
    : { data: [] as OrderItemModifier[] };

  const [{ data: neighborhood }, { data: payments }] = await Promise.all([
    order.neighborhood_id
      ? supabase.from("neighborhoods").select("*").eq("id", order.neighborhood_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("payments").select("*, payment_methods(name)").eq("order_id", orderId),
  ]);

  const modifiersByItem = new Map<string, OrderItemModifier[]>();
  for (const m of (modifiers ?? []) as OrderItemModifier[]) {
    const list = modifiersByItem.get(m.order_item_id) ?? [];
    list.push(m);
    modifiersByItem.set(m.order_item_id, list);
  }

  return (
    <PrintReceipt
      kind={kind}
      order={order}
      items={items ?? []}
      modifiersByItem={Object.fromEntries(modifiersByItem)}
      storeName={storeSettings?.store_name ?? "Esquina Pasteburguer"}
      neighborhoodName={neighborhood?.name ?? null}
      defaultPaperWidth={(printerSettings?.paper_width as "58mm" | "80mm") ?? "80mm"}
      payments={(payments ?? []) as unknown as PaymentWithMethod[]}
    />
  );
}
