"use client";

import { useState } from "react";
import { NeighborhoodForm } from "@/components/admin/NeighborhoodForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { deleteNeighborhood } from "@/app/admin/(dashboard)/bairros/actions";
import { formatCurrency } from "@/lib/utils/currency";
import type { Neighborhood } from "@/lib/types";

export function NeighborhoodList({
  neighborhoods,
}: {
  neighborhoods: Neighborhood[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(neighborhood: Neighborhood) {
    setEditing(neighborhood);
    setFormOpen(true);
  }

  async function handleDelete(neighborhood: Neighborhood) {
    if (!confirm(`Excluir o bairro "${neighborhood.name}"?`)) return;
    setPendingId(neighborhood.id);
    setError(null);
    const result = await deleteNeighborhood(neighborhood.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Bairros
        </h1>
        <Button onClick={openCreate}>Novo bairro</Button>
      </div>

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        {neighborhoods.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-soft">
            Nenhum bairro cadastrado.
          </p>
        ) : (
          neighborhoods.map((neighborhood) => (
            <div
              key={neighborhood.id}
              className="flex items-center justify-between gap-3 border-b border-ink/10 p-4 last:border-0"
            >
              <div>
                <p className="text-sm font-semibold text-ink">
                  {neighborhood.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-ink-soft">
                    {formatCurrency(neighborhood.delivery_fee)}
                  </span>
                  <Badge tone={neighborhood.active ? "success" : "muted"}>
                    {neighborhood.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(neighborhood)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === neighborhood.id}
                  onClick={() => handleDelete(neighborhood)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <NeighborhoodForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        neighborhood={editing ?? undefined}
      />
    </div>
  );
}
