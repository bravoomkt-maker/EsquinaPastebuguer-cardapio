import { PosScreen } from "@/components/pdv/PosScreen";
import { createClient } from "@/lib/supabase/server";
import type {
  CashRegister,
  Category,
  Modifier,
  ModifierGroup,
  Neighborhood,
  PaymentMethodRow,
  Product,
  ProductModifierGroup,
  ProductSize,
} from "@/lib/types";

export default async function PdvPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: categories },
    { data: products },
    { data: productSizes },
    { data: modifierGroups },
    { data: modifiers },
    { data: productModifierGroups },
    { data: neighborhoods },
    { data: paymentMethods },
    { data: openRegister },
    { data: appSettings },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("position", { ascending: true }),
    supabase.from("products").select("*").order("position", { ascending: true }),
    supabase.from("product_sizes").select("*").order("position", { ascending: true }),
    supabase
      .from("modifier_groups")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true }),
    supabase.from("modifiers").select("*").eq("active", true).order("position", { ascending: true }),
    supabase.from("product_modifier_groups").select("*"),
    supabase
      .from("neighborhoods")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true }),
    supabase
      .from("payment_methods")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true }),
    supabase.from("cash_registers").select("*").eq("status", "open").limit(1).maybeSingle(),
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const sizesByProduct: Record<string, ProductSize[]> = {};
  for (const size of (productSizes ?? []) as ProductSize[]) {
    (sizesByProduct[size.product_id] ??= []).push(size);
  }

  const modifiersByGroup: Record<string, Modifier[]> = {};
  for (const modifier of (modifiers ?? []) as Modifier[]) {
    (modifiersByGroup[modifier.group_id] ??= []).push(modifier);
  }

  const modifierGroupIdsByProduct: Record<string, string[]> = {};
  for (const link of (productModifierGroups ?? []) as ProductModifierGroup[]) {
    (modifierGroupIdsByProduct[link.product_id] ??= []).push(link.modifier_group_id);
  }

  return (
    <PosScreen
      categories={(categories ?? []) as Category[]}
      products={(products ?? []) as Product[]}
      sizesByProduct={sizesByProduct}
      modifierGroups={(modifierGroups ?? []) as ModifierGroup[]}
      modifiersByGroup={modifiersByGroup}
      modifierGroupIdsByProduct={modifierGroupIdsByProduct}
      neighborhoods={(neighborhoods ?? []) as Neighborhood[]}
      paymentMethods={(paymentMethods ?? []) as PaymentMethodRow[]}
      openRegister={(openRegister ?? null) as CashRegister | null}
      requireOpenRegisterForCash={appSettings?.require_open_register_for_cash ?? true}
      currentUserId={user?.id ?? ""}
      defaultMaxWeightGrams={appSettings?.default_max_weight_grams ?? 5000}
    />
  );
}
