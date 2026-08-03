"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  deleteProduct,
  toggleProductField,
} from "@/app/admin/(dashboard)/produtos/actions";
import { formatCurrency } from "@/lib/utils/currency";
import type { Category, ModifierGroup, Product, ProductSize } from "@/lib/types";

export function ProductList({
  products,
  categories,
  sizesByProduct,
  modifierGroups,
  modifierGroupIdsByProduct,
}: {
  products: Product[];
  categories: Category[];
  sizesByProduct: Record<string, ProductSize[]>;
  modifierGroups: ModifierGroup[];
  modifierGroupIdsByProduct: Record<string, string[]>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Excluir o produto "${product.name}"?`)) return;
    setPendingId(product.id);
    setError(null);
    const result = await deleteProduct(product.id, product.image_url);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleToggle(
    product: Product,
    field: "available" | "featured"
  ) {
    setPendingId(product.id);
    setError(null);
    const result = await toggleProductField(
      product.id,
      field,
      !product[field]
    );
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Produtos
        </h1>
        <Button onClick={openCreate} disabled={categories.length === 0}>
          Novo produto
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-ink-soft">
          Cadastre uma categoria antes de criar produtos.
        </p>
      )}

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
        {products.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-soft">
            Nenhum produto cadastrado.
          </p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 p-4 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      🍔
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {product.name}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {categoryName(product.category_id)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {product.pricing_type === "weight" ? (
                      <span className="text-sm font-bold text-ink">
                        {formatCurrency(product.price_per_kg ?? 0)}/kg
                      </span>
                    ) : (sizesByProduct[product.id]?.length ?? 0) > 0 ? (
                      <span className="text-sm font-bold text-ink">
                        A partir de{" "}
                        {formatCurrency(
                          Math.min(
                            ...sizesByProduct[product.id].map(
                              (s) => s.promo_price ?? s.price
                            )
                          )
                        )}
                      </span>
                    ) : product.promo_price ? (
                      <>
                        <span className="text-xs text-ink-soft line-through">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-sm font-bold text-brand">
                          {formatCurrency(product.promo_price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-ink">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                    {product.pricing_type === "weight" && (
                      <Badge tone="accent">Por peso</Badge>
                    )}
                    {product.featured && <Badge tone="accent">Destaque</Badge>}
                    <Badge tone={product.available ? "success" : "muted"}>
                      {product.available ? "Disponível" : "Indisponível"}
                    </Badge>
                    {!product.visible_menu && <Badge tone="muted">Oculto no cardápio</Badge>}
                    {!product.visible_pos && <Badge tone="muted">Oculto no PDV</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === product.id}
                  onClick={() => handleToggle(product, "available")}
                >
                  {product.available ? "Marcar indisponível" : "Marcar disponível"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === product.id}
                  onClick={() => handleToggle(product, "featured")}
                >
                  {product.featured ? "Remover destaque" : "Destacar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(product)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === product.id}
                  onClick={() => handleDelete(product)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <ProductForm
        key={editingProduct?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        product={editingProduct ?? undefined}
        sizes={editingProduct ? sizesByProduct[editingProduct.id] : undefined}
        modifierGroups={modifierGroups}
        selectedModifierGroupIds={
          editingProduct ? (modifierGroupIdsByProduct[editingProduct.id] ?? []) : []
        }
      />
    </div>
  );
}
