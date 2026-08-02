"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; success?: boolean } | undefined;

export async function updateStoreSettings(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const storeName = String(formData.get("store_name") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const openingHours = String(formData.get("opening_hours") ?? "").trim();
  const estimatedDeliveryTime = String(
    formData.get("estimated_delivery_time") ?? ""
  ).trim();
  const minOrderValue = Number(formData.get("min_order_value"));
  const isOpen = formData.get("is_open") === "on";
  const promoText = String(formData.get("promo_text") ?? "").trim();

  if (!storeName) return { error: "Nome da loja é obrigatório" };
  if (!whatsappNumber) return { error: "Número do WhatsApp é obrigatório" };
  if (Number.isNaN(minOrderValue) || minOrderValue < 0) {
    return { error: "Informe um pedido mínimo válido" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      store_name: storeName,
      whatsapp_number: whatsappNumber.replace(/\D/g, ""),
      opening_hours: openingHours,
      estimated_delivery_time: estimatedDeliveryTime,
      min_order_value: minOrderValue,
      is_open: isOpen,
      promo_text: promoText || null,
    })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/admin/configuracoes");
  revalidatePath("/");
  return { success: true };
}
