import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PdvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "cozinha") {
    redirect("/cozinha");
  }

  return <div className="min-h-screen bg-surface">{children}</div>;
}
