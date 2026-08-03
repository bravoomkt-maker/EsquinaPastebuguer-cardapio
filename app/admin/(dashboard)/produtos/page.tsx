import { ProductList } from "@/components/admin/ProductList";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  ModifierGroup,
  Product,
  ProductModifierGroup,
  ProductSize,
} from "@/lib/types";

export default async function ProdutosPage() {
  const supabase = await createClient();

  const [
    { data: products },
    { data: categories },
    { data: productSizes },
    { data: modifierGroups },
    { data: productModifierGroups },
  ] = await Promise.all([
    supabase.from("products").select("*").order("position", { ascending: true }),
    supabase.from("categories").select("*").order("position", { ascending: true }),
    supabase.from("product_sizes").select("*").order("position", { ascending: true }),
    supabase.from("modifier_groups").select("*").order("position", { ascending: true }),
    supabase.from("product_modifier_groups").select("*"),
  ]);

  const sizesByProduct: Record<string, ProductSize[]> = {};
  for (const size of (productSizes ?? []) as ProductSize[]) {
    (sizesByProduct[size.product_id] ??= []).push(size);
  }

  const modifierGroupIdsByProduct: Record<string, string[]> = {};
  for (const link of (productModifierGroups ?? []) as ProductModifierGroup[]) {
    (modifierGroupIdsByProduct[link.product_id] ??= []).push(link.modifier_group_id);
  }

  return (
    <ProductList
      products={(products ?? []) as Product[]}
      categories={(categories ?? []) as Category[]}
      sizesByProduct={sizesByProduct}
      modifierGroups={(modifierGroups ?? []) as ModifierGroup[]}
      modifierGroupIdsByProduct={modifierGroupIdsByProduct}
    />
  );
}
