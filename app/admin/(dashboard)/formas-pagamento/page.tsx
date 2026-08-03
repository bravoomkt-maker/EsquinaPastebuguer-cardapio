import { PaymentMethodList } from "@/components/admin/PaymentMethodList";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethodRow } from "@/lib/types";

export default async function FormasPagamentoPage() {
  const supabase = await createClient();

  const { data: methods } = await supabase
    .from("payment_methods")
    .select("*")
    .order("position", { ascending: true });

  return <PaymentMethodList methods={(methods ?? []) as PaymentMethodRow[]} />;
}
