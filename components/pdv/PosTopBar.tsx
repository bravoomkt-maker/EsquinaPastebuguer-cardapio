"use client";

import { ORDER_TYPE_LABELS, type OrderType } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const ORDER_TYPES = Object.keys(ORDER_TYPE_LABELS) as OrderType[];

export function PosTopBar({
  orderType,
  onOrderTypeChange,
}: {
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 bg-ink px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-display text-lg uppercase tracking-wide text-white">
          Esquina Pasteburguer
        </span>
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase text-white">
          PDV
        </span>
      </div>

      <nav className="flex gap-1 rounded-full bg-white/10 p-1">
        {ORDER_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onOrderTypeChange(type)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              orderType === type
                ? "bg-brand text-white"
                : "text-white/70 hover:text-white"
            )}
          >
            {ORDER_TYPE_LABELS[type]}
          </button>
        ))}
      </nav>
    </header>
  );
}
