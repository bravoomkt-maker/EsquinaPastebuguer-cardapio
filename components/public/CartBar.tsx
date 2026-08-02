"use client";

import { cartSubtotal, useCartStore } from "@/lib/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (itemCount === 0) return null;

  return (
    <div className="sticky bottom-0 z-30 px-4 pb-4">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between rounded-full bg-brand px-5 py-3.5 text-white shadow-lg"
      >
        <span className="text-sm font-semibold">
          Ver carrinho ({itemCount} {itemCount === 1 ? "item" : "itens"})
        </span>
        <span className="text-sm font-bold">
          {formatCurrency(cartSubtotal(items))}
        </span>
      </button>
    </div>
  );
}
