"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

async function setStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cozinha");
  revalidatePath("/admin/pedidos");
}

export async function startPreparing(id: string): Promise<ActionResult> {
  return setStatus(id, "preparing");
}

export async function markReady(id: string): Promise<ActionResult> {
  return setStatus(id, "ready");
}

export async function reopenToPreparing(id: string): Promise<ActionResult> {
  return setStatus(id, "preparing");
}
