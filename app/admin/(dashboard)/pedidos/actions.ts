"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/pedidos");
  revalidatePath("/cozinha");
}

export async function cancelOrder(id: string): Promise<ActionResult> {
  return updateOrderStatus(id, "cancelled");
}

export async function reopenOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("source")
    .eq("id", id)
    .maybeSingle();

  const status: OrderStatus = order?.source === "pdv" ? "confirmed" : "pending";
  return updateOrderStatus(id, status);
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/pedidos");
}
