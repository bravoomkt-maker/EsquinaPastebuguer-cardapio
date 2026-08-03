"use client";

import { posCartItemTotal, usePosCartStore } from "@/lib/store/posCartStore";
import { formatCurrency } from "@/lib/utils/currency";

export function CartItemsList({ emptyLabel }: { emptyLabel?: string }) {
  const items = usePosCartStore((s) => s.items);
  const removeItem = usePosCartStore((s) => s.removeItem);
  const setQuantity = usePosCartStore((s) => s.setQuantity);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/50">
        {emptyLabel ?? "Nenhum item adicionado ainda."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const locked = item.saleType === "weight" || item.modifiers.length > 0;
        return (
          <li key={item.lineId} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                {item.saleType === "weight" && (
                  <p className="text-xs text-white/50">
                    Peso: {item.weightGrams} g · {formatCurrency(item.pricePerKg ?? 0)}/kg
                  </p>
                )}
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-white/50">
                    {item.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                {item.notes && <p className="text-xs italic text-white/50">{item.notes}</p>}
              </div>
              <span className="shrink-0 text-sm font-bold text-white">
                {formatCurrency(posCartItemTotal(item))}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              {locked ? (
                <span className="text-xs text-white/50">Qtd: {item.quantity}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.lineId, item.quantity - 1)}
                    className="h-7 w-7 rounded-full bg-white/10 text-white"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.lineId, item.quantity + 1)}
                    className="h-7 w-7 rounded-full bg-white/10 text-white"
                  >
                    +
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remover "${item.name}" do pedido?`)) removeItem(item.lineId);
                }}
                className="text-xs font-semibold text-brand"
              >
                Remover
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
