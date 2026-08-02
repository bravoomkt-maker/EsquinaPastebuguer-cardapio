"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | undefined;

export async function cancelOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/pedidos");
}

export async function reopenOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "pending" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/pedidos");
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/pedidos");
}
