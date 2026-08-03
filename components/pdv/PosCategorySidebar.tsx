"use client";

import { cn } from "@/lib/utils/cn";
import type { Category } from "@/lib/types";

export function PosCategorySidebar({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <aside className="flex min-h-0 w-40 shrink-0 flex-col gap-1 overflow-y-auto bg-ink p-3 md:w-52">
      <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-white/40">
        Categorias
      </p>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
          selectedId === null
            ? "bg-brand text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "truncate rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
            selectedId === category.id
              ? "bg-brand text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          {category.name}
        </button>
      ))}
    </aside>
  );
}
