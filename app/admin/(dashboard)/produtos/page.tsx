import { ProductList } from "@/components/admin/ProductList";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export default async function ProdutosPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").order("position", { ascending: true }),
    supabase.from("categories").select("*").order("position", { ascending: true }),
  ]);

  return (
    <ProductList
      products={(products ?? []) as Product[]}
      categories={(categories ?? []) as Category[]}
    />
  );
}
