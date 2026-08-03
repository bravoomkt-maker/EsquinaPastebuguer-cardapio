"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | undefined;

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23503") {
    return "Não é possível excluir: existem produtos ou pedidos vinculados.";
  }
  return error.message;
}

// --- Grupos de adicionais ---

export async function createModifierGroup(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const minSelect = Number(formData.get("min_select") ?? 0);
  const maxSelect = Number(formData.get("max_select") ?? 1);
  const required = formData.get("required") === "on";

  if (!name) return { error: "Nome é obrigatório" };
  if (!Number.isInteger(minSelect) || minSelect < 0) {
    return { error: "Quantidade mínima inválida" };
  }
  if (!Number.isInteger(maxSelect) || maxSelect < 1) {
    return { error: "Quantidade máxima inválida" };
  }
  if (minSelect > maxSelect) {
    return { error: "A quantidade mínima não pode ser maior que a máxima" };
  }

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("modifier_groups")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("modifier_groups").insert({
    name,
    min_select: minSelect,
    max_select: maxSelect,
    required,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}

export async function updateModifierGroup(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const minSelect = Number(formData.get("min_select") ?? 0);
  const maxSelect = Number(formData.get("max_select") ?? 1);
  const required = formData.get("required") === "on";
  const active = formData.get("active") === "on";

  if (!name) return { error: "Nome é obrigatório" };
  if (!Number.isInteger(minSelect) || minSelect < 0) {
    return { error: "Quantidade mínima inválida" };
  }
  if (!Number.isInteger(maxSelect) || maxSelect < 1) {
    return { error: "Quantidade máxima inválida" };
  }
  if (minSelect > maxSelect) {
    return { error: "A quantidade mínima não pode ser maior que a máxima" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("modifier_groups")
    .update({ name, min_select: minSelect, max_select: maxSelect, required, active })
    .eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}

export async function deleteModifierGroup(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("modifier_groups").delete().eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}

// --- Adicionais (dentro de um grupo) ---

export async function createModifier(
  groupId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

  if (!name) return { error: "Nome é obrigatório" };
  if (Number.isNaN(price) || price < 0) {
    return { error: "Informe um preço válido" };
  }

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("modifiers")
    .select("position")
    .eq("group_id", groupId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("modifiers").insert({
    group_id: groupId,
    name,
    price,
    position: (last?.position ?? 0) + 1,
  });

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}

export async function updateModifier(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const active = formData.get("active") === "on";

  if (!name) return { error: "Nome é obrigatório" };
  if (Number.isNaN(price) || price < 0) {
    return { error: "Informe um preço válido" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("modifiers")
    .update({ name, price, active })
    .eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}

export async function toggleModifierActive(
  id: string,
  value: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("modifiers")
    .update({ active: value })
    .eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}

export async function deleteModifier(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("modifiers").delete().eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/adicionais");
}
