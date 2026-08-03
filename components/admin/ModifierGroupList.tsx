"use client";

import { useState } from "react";
import { ModifierForm } from "@/components/admin/ModifierForm";
import { ModifierGroupForm } from "@/components/admin/ModifierGroupForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  deleteModifier,
  deleteModifierGroup,
  toggleModifierActive,
} from "@/app/admin/(dashboard)/adicionais/actions";
import { formatCurrency } from "@/lib/utils/currency";
import type { Modifier, ModifierGroup } from "@/lib/types";

export function ModifierGroupList({
  groups,
  modifiersByGroup,
}: {
  groups: ModifierGroup[];
  modifiersByGroup: Record<string, Modifier[]>;
}) {
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);
  const [modifierFormState, setModifierFormState] = useState<{
    groupId: string;
    modifier?: Modifier;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteGroup(group: ModifierGroup) {
    if (!confirm(`Excluir o grupo "${group.name}" e todos os seus adicionais?`))
      return;
    setPendingId(group.id);
    setError(null);
    const result = await deleteModifierGroup(group.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleDeleteModifier(modifier: Modifier) {
    if (!confirm(`Excluir o adicional "${modifier.name}"?`)) return;
    setPendingId(modifier.id);
    setError(null);
    const result = await deleteModifier(modifier.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleToggleModifier(modifier: Modifier) {
    setPendingId(modifier.id);
    setError(null);
    const result = await toggleModifierActive(modifier.id, !modifier.active);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Adicionais
        </h1>
        <Button
          onClick={() => {
            setEditingGroup(null);
            setGroupFormOpen(true);
          }}
        >
          Novo grupo
        </Button>
      </div>

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft ring-1 ring-ink/10">
          Nenhum grupo de adicionais cadastrado. Um produto sem grupos vinculados
          simplesmente não oferece adicionais no PDV — não é obrigatório usar.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{group.name}</p>
                    <Badge tone={group.active ? "success" : "muted"}>
                      {group.active ? "Ativo" : "Inativo"}
                    </Badge>
                    {group.required && <Badge tone="accent">Obrigatório</Badge>}
                  </div>
                  <p className="text-xs text-ink-soft">
                    Seleção: {group.min_select} a {group.max_select}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setModifierFormState({ groupId: group.id, modifier: undefined })
                    }
                  >
                    + Adicional
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingGroup(group);
                      setGroupFormOpen(true);
                    }}
                  >
                    Editar grupo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === group.id}
                    onClick={() => handleDeleteGroup(group)}
                  >
                    Excluir grupo
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1.5 border-t border-ink/10 pt-3">
                {(modifiersByGroup[group.id] ?? []).length === 0 ? (
                  <p className="text-xs text-ink-soft">Nenhum adicional neste grupo.</p>
                ) : (
                  (modifiersByGroup[group.id] ?? []).map((modifier) => (
                    <div
                      key={modifier.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-ink">{modifier.name}</span>
                        <span className="text-ink-soft">
                          {formatCurrency(modifier.price)}
                        </span>
                        {!modifier.active && <Badge tone="muted">Inativo</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={pendingId === modifier.id}
                          onClick={() => handleToggleModifier(modifier)}
                          className="text-xs font-semibold text-ink-soft hover:text-ink"
                        >
                          {modifier.active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setModifierFormState({ groupId: group.id, modifier })
                          }
                          className="text-xs font-semibold text-ink-soft hover:text-ink"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={pendingId === modifier.id}
                          onClick={() => handleDeleteModifier(modifier)}
                          className="text-xs font-semibold text-brand"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModifierGroupForm
        key={editingGroup?.id ?? "new-group"}
        open={groupFormOpen}
        onClose={() => setGroupFormOpen(false)}
        group={editingGroup ?? undefined}
      />

      {modifierFormState && (
        <ModifierForm
          key={modifierFormState.modifier?.id ?? `new-${modifierFormState.groupId}`}
          open
          onClose={() => setModifierFormState(null)}
          groupId={modifierFormState.groupId}
          modifier={modifierFormState.modifier}
        />
      )}
    </div>
  );
}
