import { CategoryList } from "@/components/admin/CategoryList";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("position", { ascending: true });

  const categories: Category[] = data ?? [];

  return <CategoryList categories={categories} />;
}
