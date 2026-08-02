"use client";

import { cn } from "@/lib/utils/cn";
import type { Category } from "@/lib/types";

export function CategoryNav({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          selectedId === null
            ? "bg-brand text-white"
            : "bg-white text-ink-soft ring-1 ring-inset ring-ink/10"
        )}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            selectedId === category.id
              ? "bg-brand text-white"
              : "bg-white text-ink-soft ring-1 ring-inset ring-ink/10"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
