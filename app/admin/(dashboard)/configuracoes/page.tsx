import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/lib/types";

const FALLBACK_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "Esquina Pasteburguer",
  whatsapp_number: "",
  opening_hours: "",
  is_open: false,
  min_order_value: 0,
  estimated_delivery_time: "",
  logo_url: null,
  banner_url: null,
  promo_text: null,
  updated_at: new Date().toISOString(),
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Configurações da loja
      </h1>
      <StoreSettingsForm settings={data ?? FALLBACK_SETTINGS} />
    </div>
  );
}
