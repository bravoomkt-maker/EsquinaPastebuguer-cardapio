import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Logado como {user?.email}
      </p>
    </div>
  );
}
