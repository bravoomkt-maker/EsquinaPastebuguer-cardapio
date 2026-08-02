"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | undefined;

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23503") {
    return "Não é possível excluir: existem produtos cadastrados nesta categoria.";
  }
  return error.message;
}

export async function createCategory(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const allowHalfHalf = formData.get("allow_half_half") === "on";
  if (!name) return { error: "Nome é obrigatório" };

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    name,
    position: (last?.position ?? 0) + 1,
    allow_half_half: allowHalfHalf,
  });

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function updateCategory(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") === "on";
  const allowHalfHalf = formData.get("allow_half_half") === "on";
  if (!name) return { error: "Nome é obrigatório" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, active, allow_half_half: allowHalfHalf })
    .eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function moveCategory(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: categories, error: listError } = await supabase
    .from("categories")
    .select("id, position")
    .order("position", { ascending: true });

  if (listError || !categories) return { error: listError?.message };

  const index = categories.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) return;

  const current = categories[index];
  const swap = categories[swapIndex];

  const [{ error: error1 }, { error: error2 }] = await Promise.all([
    supabase
      .from("categories")
      .update({ position: swap.position })
      .eq("id", current.id),
    supabase
      .from("categories")
      .update({ position: current.position })
      .eq("id", swap.id),
  ]);

  if (error1 || error2) return { error: (error1 ?? error2)?.message };

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}
