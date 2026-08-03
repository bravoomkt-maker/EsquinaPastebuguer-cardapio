import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ImprimirLayout({
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

  return <div className="min-h-screen bg-surface">{children}</div>;
}
