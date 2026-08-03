import { UsersList } from "@/components/admin/UsersList";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (currentProfile?.role !== "admin") {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-ink/10">
        Acesso restrito a administradores.
      </div>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <UsersList profiles={(profiles ?? []) as Profile[]} currentUserId={user?.id ?? ""} />
  );
}
