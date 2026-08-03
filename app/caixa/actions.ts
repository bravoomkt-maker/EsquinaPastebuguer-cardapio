"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string } | undefined;

export async function openRegister(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const openingAmount = Number(formData.get("opening_amount") ?? 0);
  const openingNotes = String(formData.get("opening_notes") ?? "").trim();

  if (Number.isNaN(openingAmount) || openingAmount < 0) {
    return { error: "Informe um valor inicial válido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada, faça login novamente" };

  const { data: existing } = await supabase
    .from("cash_registers")
    .select("id")
    .eq("status", "open")
    .maybeSingle();

  if (existing) return { error: "Já existe um caixa aberto" };

  const { error } = await supabase.from("cash_registers").insert({
    opened_by: user.id,
    opening_amount: openingAmount,
    opening_notes: openingNotes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/caixa");
}

export async function addMovement(
  registerId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const type = String(formData.get("type") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const paymentMethodId = String(formData.get("payment_method_id") ?? "") || null;

  const validTypes = ["entrada", "suprimento", "saida", "sangria", "estorno"];
  if (!validTypes.includes(type)) return { error: "Tipo de movimentação inválido" };
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return { error: "Informe um valor válido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("cash_movements").insert({
    cash_register_id: registerId,
    type,
    amount,
    description: description || null,
    payment_method_id: paymentMethodId,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/caixa");
}

export async function closeRegister(
  registerId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const countedCash = Number(formData.get("counted_cash_amount") ?? 0);
  const closingNotes = String(formData.get("closing_notes") ?? "").trim();

  if (Number.isNaN(countedCash) || countedCash < 0) {
    return { error: "Informe o valor contado em dinheiro" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada, faça login novamente" };

  const { data: expected } = await supabase.rpc("cash_register_expected_cash", {
    p_cash_register_id: registerId,
  });

  const expectedCash = expected ?? 0;

  const { error } = await supabase
    .from("cash_registers")
    .update({
      status: "closed",
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      counted_cash_amount: countedCash,
      expected_cash_amount: expectedCash,
      cash_difference: Math.round((countedCash - expectedCash) * 100) / 100,
      closing_notes: closingNotes || null,
    })
    .eq("id", registerId);

  if (error) return { error: error.message };

  revalidatePath("/caixa");
  revalidatePath("/pdv");
}

export async function reopenRegister(registerId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Somente um administrador pode reabrir um caixa fechado" };
  }

  const { error } = await supabase
    .from("cash_registers")
    .update({
      status: "open",
      closed_by: null,
      closed_at: null,
      counted_cash_amount: null,
      expected_cash_amount: null,
      cash_difference: null,
    })
    .eq("id", registerId);

  if (error) return { error: error.message };

  revalidatePath("/caixa");
}
