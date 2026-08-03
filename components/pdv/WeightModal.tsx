"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils/currency";
import { computeWeightValue, isValidWeight } from "@/lib/utils/weight";
import type { Product } from "@/lib/types";

const QUICK_WEIGHTS_G = [100, 250, 300, 500, 750, 1000];

export function WeightModal({
  open,
  onClose,
  product,
  defaultMaxWeightGrams,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  defaultMaxWeightGrams: number;
  onConfirm: (weightGrams: number) => void;
}) {
  const [weightInput, setWeightInput] = useState("");
  const pricePerKg = product.price_per_kg ?? 0;
  const maxWeight = product.max_weight_grams ?? defaultMaxWeightGrams;

  const weightGrams = useMemo(() => {
    const parsed = Number(weightInput.replace(",", "."));
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }, [weightInput]);

  const value = computeWeightValue(weightGrams, pricePerKg);
  const isValid = isValidWeight(weightGrams, maxWeight);

  function handleConfirm() {
    if (!isValid) return;
    onConfirm(weightGrams);
    setWeightInput("");
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Preço por kg: <span className="font-semibold text-ink">{formatCurrency(pricePerKg)}</span>
        </p>

        <div className="grid grid-cols-3 gap-2">
          {QUICK_WEIGHTS_G.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setWeightInput(String(g))}
              className="rounded-lg border border-ink/15 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              {g >= 1000 ? `${g / 1000} kg` : `${g} g`}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Peso (gramas)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            autoFocus
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Ex: 350"
            className="h-14 w-full rounded-lg border border-ink/15 bg-white px-3.5 text-center text-2xl font-bold text-ink outline-none focus:border-brand"
          />
          {weightGrams > maxWeight && (
            <p className="mt-1 text-xs text-brand">
              Peso máximo permitido: {maxWeight} g
            </p>
          )}
        </div>

        <div className="rounded-xl bg-surface p-4 text-center">
          <p className="text-xs text-ink-soft">Valor a cobrar</p>
          <p className="text-2xl font-bold text-ink">{formatCurrency(value)}</p>
        </div>

        <Button type="button" disabled={!isValid} onClick={handleConfirm} className="w-full">
          Adicionar ao pedido
        </Button>
      </div>
    </Modal>
  );
}
