"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { logout } from "@/app/admin/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/pdv", label: "PDV" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/cozinha", label: "Cozinha" },
  { href: "/caixa", label: "Caixa" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/adicionais", label: "Adicionais" },
  { href: "/admin/bairros", label: "Bairros" },
  { href: "/admin/formas-pagamento", label: "Formas de pagamento" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-ink/10 bg-white p-4 md:h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="mb-4 px-2">
        <p className="font-display text-base uppercase tracking-wide text-ink">
          Esquina Pasteburguer
        </p>
        <p className="text-xs text-ink-soft">Painel administrativo</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:bg-surface"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-soft hover:bg-surface"
        >
          Sair
        </button>
      </form>
    </aside>
  );
}
