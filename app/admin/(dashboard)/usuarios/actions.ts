"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/types";

export type ActionResult = { error?: string } | undefined;

async function requireAdmin(): Promise<{ error?: string }> {
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
    return { error: "Apenas administradores podem gerenciar usuários" };
  }

  return {};
}

export async function updateUserRole(
  id: string,
  role: StaffRole
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
}

export async function updateUserName(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const fullName = String(formData.get("full_name") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName || null })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
}
