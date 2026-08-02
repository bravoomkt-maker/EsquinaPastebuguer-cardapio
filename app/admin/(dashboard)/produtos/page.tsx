import { ProductList } from "@/components/admin/ProductList";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductSize } from "@/lib/types";

export default async function ProdutosPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }, { data: productSizes }] =
    await Promise.all([
      supabase.from("products").select("*").order("position", { ascending: true }),
      supabase.from("categories").select("*").order("position", { ascending: true }),
      supabase.from("product_sizes").select("*").order("position", { ascending: true }),
    ]);

  const sizesByProduct: Record<string, ProductSize[]> = {};
  for (const size of (productSizes ?? []) as ProductSize[]) {
    (sizesByProduct[size.product_id] ??= []).push(size);
  }

  return (
    <ProductList
      products={(products ?? []) as Product[]}
      categories={(categories ?? []) as Category[]}
      sizesByProduct={sizesByProduct}
    />
  );
}
