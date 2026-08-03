"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  createModifier,
  updateModifier,
} from "@/app/admin/(dashboard)/adicionais/actions";
import type { Modifier } from "@/lib/types";

export function ModifierForm({
  open,
  onClose,
  groupId,
  modifier,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  modifier?: Modifier;
}) {
  const [name, setName] = useState(modifier?.name ?? "");
  const [price, setPrice] = useState(modifier ? String(modifier.price) : "0");
  const [active, setActive] = useState(modifier?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("price", price);
    if (active) formData.set("active", "on");

    const result = modifier
      ? await updateModifier(modifier.id, undefined, formData)
      : await createModifier(groupId, undefined, formData);

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
      title={modifier ? "Editar adicional" : "Novo adicional"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          placeholder="Ex: Bacon"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Preço (R$)"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        {modifier && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Ativo
          </label>
        )}

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {modifier ? "Salvar" : "Adicionar"}
        </Button>
      </form>
    </Modal>
  );
}
