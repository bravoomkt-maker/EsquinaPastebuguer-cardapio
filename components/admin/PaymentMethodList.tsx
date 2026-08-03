"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createPaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodActive,
} from "@/app/admin/(dashboard)/formas-pagamento/actions";
import type { PaymentMethodRow } from "@/lib/types";

export function PaymentMethodList({ methods }: { methods: PaymentMethodRow[] }) {
  const [name, setName] = useState("");
  const [allowsChange, setAllowsChange] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleToggle(method: PaymentMethodRow) {
    setPendingId(method.id);
    setError(null);
    const result = await togglePaymentMethodActive(method.id, !method.active);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleDelete(method: PaymentMethodRow) {
    if (!confirm(`Excluir a forma de pagamento "${method.name}"?`)) return;
    setPendingId(method.id);
    setError(null);
    const result = await deletePaymentMethod(method.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("code", name);
    if (allowsChange) formData.set("allows_change", "on");

    const result = await createPaymentMethod(undefined, formData);
    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setName("");
    setAllowsChange(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Formas de pagamento
      </h1>

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        {methods.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-soft">
            Nenhuma forma de pagamento cadastrada.
          </p>
        ) : (
          methods.map((method) => (
            <div
              key={method.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-4 last:border-0"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{method.name}</p>
                <Badge tone={method.active ? "success" : "muted"}>
                  {method.active ? "Ativa" : "Inativa"}
                </Badge>
                {method.allows_change && <Badge tone="accent">Calcula troco</Badge>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === method.id}
                  onClick={() => handleToggle(method)}
                >
                  {method.active ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === method.id}
                  onClick={() => handleDelete(method)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10"
      >
        <div className="min-w-48 flex-1">
          <Input
            label="Nova forma de pagamento"
            placeholder="Ex: Vale-refeição"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <label className="mb-2.5 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={allowsChange}
            onChange={(e) => setAllowsChange(e.target.checked)}
          />
          Calcula troco (como dinheiro)
        </label>
        <Button type="submit" isLoading={isSubmitting}>
          Adicionar
        </Button>
      </form>
    </div>
  );
}
