import { PosSettingsForm } from "@/components/admin/PosSettingsForm";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings, PrinterSettings, StoreSettings } from "@/lib/types";

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

const FALLBACK_APP_SETTINGS: AppSettings = {
  id: 1,
  require_open_register_for_cash: true,
  default_max_weight_grams: 5000,
  updated_at: new Date().toISOString(),
};

const FALLBACK_PRINTER_SETTINGS: PrinterSettings = {
  id: 1,
  paper_width: "80mm",
  print_kitchen_copy: true,
  print_customer_receipt: true,
  updated_at: new Date().toISOString(),
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const [{ data: storeSettings }, { data: appSettings }, { data: printerSettings }] =
    await Promise.all([
      supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("printer_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Configurações
      </h1>
      <div className="flex flex-wrap gap-4">
        <StoreSettingsForm settings={storeSettings ?? FALLBACK_SETTINGS} />
        <PosSettingsForm
          appSettings={appSettings ?? FALLBACK_APP_SETTINGS}
          printerSettings={printerSettings ?? FALLBACK_PRINTER_SETTINGS}
        />
      </div>
    </div>
  );
}
