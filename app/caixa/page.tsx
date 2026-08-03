import { CaixaScreen } from "@/components/caixa/CaixaScreen";
import { createClient } from "@/lib/supabase/server";
import type { CashMovement, CashRegister, PaymentMethodRow, Payment } from "@/lib/types";

export default async function CaixaPage() {
  const supabase = await createClient();

  const [{ data: register }, { data: paymentMethods }] = await Promise.all([
    supabase.from("cash_registers").select("*").eq("status", "open").maybeSingle(),
    supabase.from("payment_methods").select("*").order("position", { ascending: true }),
  ]);

  if (!register) {
    return (
      <CaixaScreen
        register={null}
        movements={[]}
        payments={[]}
        paymentMethods={(paymentMethods ?? []) as PaymentMethodRow[]}
        expectedCash={0}
      />
    );
  }

  const [{ data: movements }, { data: payments }, { data: expectedCash }] = await Promise.all([
    supabase
      .from("cash_movements")
      .select("*")
      .eq("cash_register_id", register.id)
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("cash_register_id", register.id),
    supabase.rpc("cash_register_expected_cash", { p_cash_register_id: register.id }),
  ]);

  return (
    <CaixaScreen
      register={register as CashRegister}
      movements={(movements ?? []) as CashMovement[]}
      payments={(payments ?? []) as Payment[]}
      paymentMethods={(paymentMethods ?? []) as PaymentMethodRow[]}
      expectedCash={expectedCash ?? 0}
    />
  );
}
