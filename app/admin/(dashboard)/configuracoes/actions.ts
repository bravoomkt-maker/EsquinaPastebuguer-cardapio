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

export async function updatePosSettings(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const requireOpenRegisterForCash = formData.get("require_open_register_for_cash") === "on";
  const defaultMaxWeightGrams = Number(formData.get("default_max_weight_grams"));
  const paperWidth = formData.get("paper_width") === "58mm" ? "58mm" : "80mm";
  const printKitchenCopy = formData.get("print_kitchen_copy") === "on";
  const printCustomerReceipt = formData.get("print_customer_receipt") === "on";

  if (!Number.isInteger(defaultMaxWeightGrams) || defaultMaxWeightGrams <= 0) {
    return { error: "Informe um peso máximo padrão válido" };
  }

  const supabase = await createClient();

  const [{ error: appError }, { error: printerError }] = await Promise.all([
    supabase
      .from("app_settings")
      .update({
        require_open_register_for_cash: requireOpenRegisterForCash,
        default_max_weight_grams: defaultMaxWeightGrams,
      })
      .eq("id", 1),
    supabase
      .from("printer_settings")
      .update({
        paper_width: paperWidth,
        print_kitchen_copy: printKitchenCopy,
        print_customer_receipt: printCustomerReceipt,
      })
      .eq("id", 1),
  ]);

  if (appError || printerError) return { error: (appError ?? printerError)?.message };

  revalidatePath("/admin/configuracoes");
  return { success: true };
}
