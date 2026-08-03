"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  createNeighborhood,
  updateNeighborhood,
} from "@/app/admin/(dashboard)/bairros/actions";
import type { Neighborhood } from "@/lib/types";

export function NeighborhoodForm({
  open,
  onClose,
  neighborhood,
}: {
  open: boolean;
  onClose: () => void;
  neighborhood?: Neighborhood;
}) {
  const [name, setName] = useState(neighborhood?.name ?? "");
  const [deliveryFee, setDeliveryFee] = useState(
    neighborhood ? String(neighborhood.delivery_fee) : ""
  );
  const [estimatedTime, setEstimatedTime] = useState(
    neighborhood?.estimated_time ?? ""
  );
  const [minOrderValue, setMinOrderValue] = useState(
    neighborhood?.min_order_value ? String(neighborhood.min_order_value) : ""
  );
  const [active, setActive] = useState(neighborhood?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("delivery_fee", deliveryFee);
    formData.set("estimated_time", estimatedTime);
    formData.set("min_order_value", minOrderValue);
    if (active) formData.set("active", "on");

    const result = neighborhood
      ? await updateNeighborhood(neighborhood.id, undefined, formData)
      : await createNeighborhood(undefined, formData);

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
      title={neighborhood ? "Editar bairro" : "Novo bairro"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome do bairro"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Taxa de entrega (R$)"
          type="number"
          step="0.01"
          min="0"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          required
        />

        <Input
          label="Tempo médio de entrega (opcional)"
          placeholder="Ex: 40-60 min"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
        />

        <Input
          label="Pedido mínimo para este bairro (opcional)"
          type="number"
          step="0.01"
          min="0"
          placeholder="Deixe em branco para usar o mínimo geral da loja"
          value={minOrderValue}
          onChange={(e) => setMinOrderValue(e.target.value)}
        />

        {neighborhood && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Ativo (disponível no checkout)
          </label>
        )}

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {neighborhood ? "Salvar" : "Criar bairro"}
        </Button>
      </form>
    </Modal>
  );
}
