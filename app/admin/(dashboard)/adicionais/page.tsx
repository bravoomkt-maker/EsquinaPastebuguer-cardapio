import { ModifierGroupList } from "@/components/admin/ModifierGroupList";
import { createClient } from "@/lib/supabase/server";
import type { Modifier, ModifierGroup } from "@/lib/types";

export default async function AdicionaisPage() {
  const supabase = await createClient();

  const [{ data: groups }, { data: modifiers }] = await Promise.all([
    supabase.from("modifier_groups").select("*").order("position", { ascending: true }),
    supabase.from("modifiers").select("*").order("position", { ascending: true }),
  ]);

  const modifiersByGroup: Record<string, Modifier[]> = {};
  for (const modifier of (modifiers ?? []) as Modifier[]) {
    (modifiersByGroup[modifier.group_id] ??= []).push(modifier);
  }

  return (
    <ModifierGroupList
      groups={(groups ?? []) as ModifierGroup[]}
      modifiersByGroup={modifiersByGroup}
    />
  );
}
