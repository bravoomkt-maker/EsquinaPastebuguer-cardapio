"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useCartStore } from "@/lib/store/cartStore";
import { formatCurrency } from "@/lib/utils/currency";
import type { Category, Product, ProductSize } from "@/lib/types";

export function SizeHalfModal({
  open,
  onClose,
  product,
  category,
  sizes,
  siblingProducts,
  sizesByProduct,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  category: Category | undefined;
  sizes: ProductSize[];
  siblingProducts: Product[];
  sizesByProduct: Record<string, ProductSize[]>;
}) {
  const addItem = useCartStore((state) => state.addItem);

  const orderedSizes = useMemo(
    () => [...sizes].sort((a, b) => a.position - b.position),
    [sizes]
  );

  const [sizeLabel, setSizeLabel] = useState(orderedSizes[0]?.label ?? "");
  const [mode, setMode] = useState<"whole" | "half">("whole");
  const [secondProductId, setSecondProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(product.min_quantity);

  const allowHalfHalf = category?.allow_half_half ?? false;

  const eligibleSecondProducts = useMemo(
    () =>
      siblingProducts.filter(
        (p) =>
          p.id !== product.id &&
          p.available &&
          (sizesByProduct[p.id] ?? []).some((s) => s.label === sizeLabel)
      ),
    [siblingProducts, product.id, sizesByProduct, sizeLabel]
  );

  const primarySize = orderedSizes.find((s) => s.label === sizeLabel);
  const primaryPrice = primarySize
    ? primarySize.promo_price ?? primarySize.price
    : 0;

  const secondProduct = eligibleSecondProducts.find(
    (p) => p.id === secondProductId
  );
  const secondSize = secondProductId
    ? (sizesByProduct[secondProductId] ?? []).find((s) => s.label === sizeLabel)
    : undefined;
  const secondPrice = secondSize
    ? secondSize.promo_price ?? secondSize.price
    : null;

  const isHalf = mode === "half" && !!secondProduct && secondPrice !== null;
  const unitPrice = isHalf ? Math.max(primaryPrice, secondPrice!) : primaryPrice;

  function handleSizeChange(label: string) {
    setSizeLabel(label);
    setSecondProductId("");
  }

  function handleAdd() {
    const name = isHalf
      ? `${product.name} + ${secondProduct!.name} (${sizeLabel})`
      : `${product.name} (${sizeLabel})`;

    addItem({
      productId: product.id,
      name,
      unitPrice,
      quantity,
      imageUrl: product.image_url,
      sizeLabel,
      secondProductId: isHalf ? secondProduct!.id : null,
      minQuantity: product.min_quantity,
    });

    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name}>
      <div className="flex flex-col gap-4">
        <Select
          label="Tamanho"
          value={sizeLabel}
          onChange={(e) => handleSizeChange(e.target.value)}
        >
          {orderedSizes.map((size) => (
            <option key={size.id} value={size.label}>
              {size.label} - {formatCurrency(size.promo_price ?? size.price)}
            </option>
          ))}
        </Select>

        {allowHalfHalf && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("whole")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                mode === "whole"
                  ? "bg-brand text-white"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-ink/10"
              }`}
            >
              Inteira
            </button>
            <button
              type="button"
              onClick={() => setMode("half")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                mode === "half"
                  ? "bg-brand text-white"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-ink/10"
              }`}
            >
              Meio a meio
            </button>
          </div>
        )}

        {allowHalfHalf && mode === "half" && (
          <Select
            label="Segundo sabor"
            value={secondProductId}
            onChange={(e) => setSecondProductId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {eligibleSecondProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}

        {product.min_quantity > 1 && (
          <p className="text-xs font-medium text-brand">
            Pedido mínimo: {product.min_quantity} unidades
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">Quantidade</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              disabled={quantity <= product.min_quantity}
              onClick={() =>
                setQuantity((q) => Math.max(product.min_quantity, q - 1))
              }
              aria-label="Diminuir quantidade"
            >
              −
            </Button>
            <span className="w-6 text-center text-sm font-semibold">
              {quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
            >
              +
            </Button>
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={mode === "half" && !isHalf}
          onClick={handleAdd}
        >
          Adicionar - {formatCurrency(unitPrice * quantity)}
        </Button>
      </div>
    </Modal>
  );
}
