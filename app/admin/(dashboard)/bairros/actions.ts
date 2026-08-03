"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | undefined;

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23503") {
    return "Não é possível excluir: existem pedidos vinculados a este bairro.";
  }
  if (error.code === "23505") {
    return "Já existe um bairro com esse nome.";
  }
  return error.message;
}

export async function createNeighborhood(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const deliveryFee = Number(formData.get("delivery_fee"));
  const estimatedTime = String(formData.get("estimated_time") ?? "").trim();
  const minOrderRaw = String(formData.get("min_order_value") ?? "").trim();
  const minOrderValue = minOrderRaw ? Number(minOrderRaw) : null;

  if (!name) return { error: "Nome é obrigatório" };
  if (Number.isNaN(deliveryFee) || deliveryFee < 0) {
    return { error: "Informe uma taxa de entrega válida" };
  }
  if (minOrderValue !== null && (Number.isNaN(minOrderValue) || minOrderValue < 0)) {
    return { error: "Informe um pedido mínimo válido" };
  }

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("neighborhoods")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("neighborhoods").insert({
    name,
    delivery_fee: deliveryFee,
    estimated_time: estimatedTime || null,
    min_order_value: minOrderValue,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/bairros");
  revalidatePath("/");
}

export async function updateNeighborhood(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const deliveryFee = Number(formData.get("delivery_fee"));
  const active = formData.get("active") === "on";
  const estimatedTime = String(formData.get("estimated_time") ?? "").trim();
  const minOrderRaw = String(formData.get("min_order_value") ?? "").trim();
  const minOrderValue = minOrderRaw ? Number(minOrderRaw) : null;

  if (!name) return { error: "Nome é obrigatório" };
  if (Number.isNaN(deliveryFee) || deliveryFee < 0) {
    return { error: "Informe uma taxa de entrega válida" };
  }
  if (minOrderValue !== null && (Number.isNaN(minOrderValue) || minOrderValue < 0)) {
    return { error: "Informe um pedido mínimo válido" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("neighborhoods")
    .update({
      name,
      delivery_fee: deliveryFee,
      active,
      estimated_time: estimatedTime || null,
      min_order_value: minOrderValue,
    })
    .eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/bairros");
  revalidatePath("/");
}

export async function deleteNeighborhood(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("neighborhoods").delete().eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/bairros");
  revalidatePath("/");
}
