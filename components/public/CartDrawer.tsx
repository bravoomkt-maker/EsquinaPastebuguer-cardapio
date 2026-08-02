"use client";

import { CartItemRow } from "@/components/public/CartItemRow";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cartSubtotal, useCartStore } from "@/lib/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";

export function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const items = useCartStore((state) => state.items);
  const subtotal = cartSubtotal(items);

  return (
    <Modal open={open} onClose={onClose} title="Seu carrinho">
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">
          Seu carrinho está vazio.
        </p>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
            <span className="text-sm font-semibold text-ink-soft">
              Subtotal
            </span>
            <span className="text-lg font-bold text-ink">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <Button className="mt-4 w-full" onClick={onCheckout}>
            Finalizar pedido
          </Button>
        </>
      )}
    </Modal>
  );
}
