import { NeighborhoodList } from "@/components/admin/NeighborhoodList";
import { createClient } from "@/lib/supabase/server";
import type { Neighborhood } from "@/lib/types";

export default async function BairrosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("neighborhoods")
    .select("*")
    .order("position", { ascending: true });

  return <NeighborhoodList neighborhoods={(data ?? []) as Neighborhood[]} />;
}
