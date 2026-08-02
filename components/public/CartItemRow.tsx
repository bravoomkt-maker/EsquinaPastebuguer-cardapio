"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useCartStore } from "@/lib/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";
import type { CartItem } from "@/lib/types";

export function CartItemRow({ item }: { item: CartItem }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const setNotes = useCartStore((state) => state.setNotes);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <div className="flex flex-col gap-2 border-b border-ink/10 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {item.name}
          </p>
          <p className="text-xs text-ink-soft">
            {formatCurrency(item.unitPrice)} cada
          </p>
        </div>
        <button
          type="button"
          onClick={() => removeItem(item.productId)}
          className="text-xs font-semibold text-brand"
          aria-label={`Remover ${item.name}`}
        >
          Remover
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => setQuantity(item.productId, item.quantity - 1)}
            aria-label="Diminuir quantidade"
          >
            −
          </Button>
          <span className="w-6 text-center text-sm font-semibold">
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => setQuantity(item.productId, item.quantity + 1)}
            aria-label="Aumentar quantidade"
          >
            +
          </Button>
        </div>
        <span className="text-sm font-bold text-ink">
          {formatCurrency(item.unitPrice * item.quantity)}
        </span>
      </div>

      <Textarea
        placeholder="Observação (ex: sem cebola)"
        value={item.notes}
        onChange={(event) => setNotes(item.productId, event.target.value)}
        className="min-h-16 text-xs"
      />
    </div>
  );
}
