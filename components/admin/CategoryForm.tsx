"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { createCategory, updateCategory } from "@/app/admin/(dashboard)/categorias/actions";
import type { Category } from "@/lib/types";

export function CategoryForm({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: Category;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [active, setActive] = useState(category?.active ?? true);
  const [allowHalfHalf, setAllowHalfHalf] = useState(
    category?.allow_half_half ?? false
  );
  const [minQuantity, setMinQuantity] = useState(
    String(category?.min_quantity ?? 1)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("min_quantity", minQuantity);
    if (active) formData.set("active", "on");
    if (allowHalfHalf) formData.set("allow_half_half", "on");

    const result = category
      ? await updateCategory(category.id, undefined, formData)
      : await createCategory(undefined, formData);

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Editar categoria" : "Nova categoria"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          autoFocus
        />

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          Ativa (visível no cardápio)
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={allowHalfHalf}
            onChange={(event) => setAllowHalfHalf(event.target.checked)}
          />
          Permitir meio a meio (ex: pizzas)
        </label>

        <Input
          label="Quantidade mínima total do pedido nesta categoria"
          type="number"
          step="1"
          min="1"
          value={minQuantity}
          onChange={(event) => setMinQuantity(event.target.value)}
          required
        />
        <p className="-mt-2 text-xs text-ink-soft">
          Ex: 5 para esfirras — o cliente pode misturar sabores, contanto que
          a soma chegue a esse total.
        </p>

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {category ? "Salvar" : "Criar categoria"}
        </Button>
      </form>
    </Modal>
  );
}
