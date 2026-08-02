"use client";

import { useState } from "react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  deleteCategory,
  moveCategory,
} from "@/app/admin/(dashboard)/categorias/actions";
import type { Category } from "@/lib/types";

export function CategoryList({ categories }: { categories: Category[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditingCategory(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"?`)) return;
    setPendingId(category.id);
    setError(null);
    const result = await deleteCategory(category.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setPendingId(id);
    setError(null);
    const result = await moveCategory(id, direction);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Categorias
        </h1>
        <Button onClick={openCreate}>Nova categoria</Button>
      </div>

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        {categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-soft">
            Nenhuma categoria cadastrada.
          </p>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 border-b border-ink/10 p-4 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={index === 0 || pendingId === category.id}
                    onClick={() => handleMove(category.id, "up")}
                    className="text-ink-soft disabled:opacity-30"
                    aria-label="Mover para cima"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={
                      index === categories.length - 1 ||
                      pendingId === category.id
                    }
                    onClick={() => handleMove(category.id, "down")}
                    className="text-ink-soft disabled:opacity-30"
                    aria-label="Mover para baixo"
                  >
                    ▼
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {category.name}
                  </p>
                  <Badge tone={category.active ? "success" : "muted"}>
                    {category.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(category)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  disabled={pendingId === category.id}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryForm
        key={editingCategory?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editingCategory ?? undefined}
      />
    </div>
  );
}
