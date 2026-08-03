"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  createModifierGroup,
  updateModifierGroup,
} from "@/app/admin/(dashboard)/adicionais/actions";
import type { ModifierGroup } from "@/lib/types";

export function ModifierGroupForm({
  open,
  onClose,
  group,
}: {
  open: boolean;
  onClose: () => void;
  group?: ModifierGroup;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [minSelect, setMinSelect] = useState(String(group?.min_select ?? 0));
  const [maxSelect, setMaxSelect] = useState(String(group?.max_select ?? 1));
  const [required, setRequired] = useState(group?.required ?? false);
  const [active, setActive] = useState(group?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("min_select", minSelect);
    formData.set("max_select", maxSelect);
    if (required) formData.set("required", "on");
    if (active) formData.set("active", "on");

    const result = group
      ? await updateModifierGroup(group.id, undefined, formData)
      : await createModifierGroup(undefined, formData);

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
      title={group ? "Editar grupo de adicionais" : "Novo grupo de adicionais"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome do grupo"
          placeholder="Ex: Adicionais de hambúrguer"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Seleção mínima"
            type="number"
            step="1"
            min="0"
            value={minSelect}
            onChange={(e) => setMinSelect(e.target.value)}
            required
          />
          <Input
            label="Seleção máxima"
            type="number"
            step="1"
            min="1"
            value={maxSelect}
            onChange={(e) => setMaxSelect(e.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Obrigatório escolher ao menos um item deste grupo
        </label>

        {group && (
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
          {group ? "Salvar" : "Criar grupo"}
        </Button>
      </form>
    </Modal>
  );
}
