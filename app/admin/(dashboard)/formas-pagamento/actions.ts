"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | undefined;

export async function createPaymentMethod(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  const allowsChange = formData.get("allows_change") === "on";

  if (!name) return { error: "Nome é obrigatório" };
  if (!code) return { error: "Não foi possível gerar um código a partir do nome" };

  const supabase = await createClient();

  const { data: last } = await supabase
    .from("payment_methods")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("payment_methods").insert({
    code,
    name,
    allows_change: allowsChange,
    position: (last?.position ?? 0) + 1,
  });

  if (error) {
    if (error.code === "23505") return { error: "Já existe uma forma de pagamento com esse código" };
    return { error: error.message };
  }

  revalidatePath("/admin/formas-pagamento");
}

export async function togglePaymentMethodActive(
  id: string,
  value: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ active: value })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/formas-pagamento");
}

export async function deletePaymentMethod(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return { error: "Não é possível excluir: existem pagamentos registrados com esta forma." };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/formas-pagamento");
}
