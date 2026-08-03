"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/utils/currency";
import type { PosCartModifier } from "@/lib/store/posCartStore";
import type { Modifier, ModifierGroup, Product } from "@/lib/types";

export function ModifiersModal({
  open,
  onClose,
  product,
  groups,
  modifiersByGroup,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  groups: ModifierGroup[];
  modifiersByGroup: Record<string, Modifier[]>;
  onConfirm: (selected: PosCartModifier[], notes: string) => void;
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allModifiers = useMemo(
    () => groups.flatMap((g) => modifiersByGroup[g.id] ?? []),
    [groups, modifiersByGroup]
  );

  function countInGroup(group: ModifierGroup): number {
    const ids = new Set((modifiersByGroup[group.id] ?? []).map((m) => m.id));
    return Object.entries(selected)
      .filter(([id, qty]) => ids.has(id) && qty > 0)
      .reduce((sum, [, qty]) => sum + qty, 0);
  }

  function toggleModifier(group: ModifierGroup, modifier: Modifier) {
    setError(null);
    setSelected((current) => {
      const currentQty = current[modifier.id] ?? 0;
      if (currentQty > 0) {
        const next = { ...current };
        delete next[modifier.id];
        return next;
      }

      const usedInGroup = countInGroup(group);
      if (usedInGroup >= group.max_select) {
        setError(`Selecione no máximo ${group.max_select} item(ns) em "${group.name}"`);
        return current;
      }

      return { ...current, [modifier.id]: 1 };
    });
  }

  function handleConfirm() {
    for (const group of groups) {
      const count = countInGroup(group);
      if (group.required && count < Math.max(group.min_select, 1)) {
        setError(`"${group.name}" é obrigatório`);
        return;
      }
      if (count < group.min_select) {
        setError(`Selecione ao menos ${group.min_select} item(ns) em "${group.name}"`);
        return;
      }
    }

    const result: PosCartModifier[] = allModifiers
      .filter((m) => (selected[m.id] ?? 0) > 0)
      .map((m) => ({
        modifierId: m.id,
        name: m.name,
        price: m.price,
        quantity: selected[m.id],
      }));

    onConfirm(result, notes.trim());
    setSelected({});
    setNotes("");
  }

  return (
    <Modal open={open} onClose={onClose} title={product.name} className="max-w-md">
      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{group.name}</p>
              <p className="text-xs text-ink-soft">
                {group.required ? "Obrigatório · " : ""}
                até {group.max_select}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {(modifiersByGroup[group.id] ?? []).map((modifier) => (
                <label
                  key={modifier.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-ink">
                    <input
                      type="checkbox"
                      checked={(selected[modifier.id] ?? 0) > 0}
                      onChange={() => toggleModifier(group, modifier)}
                    />
                    {modifier.name}
                  </span>
                  <span className="text-ink-soft">
                    {modifier.price > 0 ? `+ ${formatCurrency(modifier.price)}` : "Grátis"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {product.allow_notes && (
          <Textarea
            label="Observações"
            placeholder="Ex: sem cebola, ponto da carne, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}

        <Button type="button" onClick={handleConfirm} className="w-full">
          Adicionar ao pedido
        </Button>
      </div>
    </Modal>
  );
}
