"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  createProduct,
  updateProduct,
} from "@/app/admin/(dashboard)/produtos/actions";
import type { Category, Product, ProductSize } from "@/lib/types";

interface SizeRow {
  label: string;
  price: string;
  promoPrice: string;
}

export function ProductForm({
  open,
  onClose,
  categories,
  product,
  sizes,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  product?: Product;
  sizes?: ProductSize[];
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? categories[0]?.id ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [promoPrice, setPromoPrice] = useState(
    product?.promo_price ? String(product.promo_price) : ""
  );
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [minQuantity, setMinQuantity] = useState(
    String(product?.min_quantity ?? 1)
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(
    (sizes ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        label: s.label,
        price: String(s.price),
        promoPrice: s.promo_price ? String(s.promo_price) : "",
      }))
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addSizeRow() {
    setSizeRows((rows) => [...rows, { label: "", price: "", promoPrice: "" }]);
  }

  function updateSizeRow(index: number, patch: Partial<SizeRow>) {
    setSizeRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function removeSizeRow(index: number) {
    setSizeRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("category_id", categoryId);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("promo_price", promoPrice);
    formData.set("min_quantity", minQuantity);
    if (available) formData.set("available", "on");
    if (featured) formData.set("featured", "on");
    if (imageFile) formData.set("image", imageFile);
    formData.set(
      "sizes",
      JSON.stringify(
        sizeRows
          .filter((row) => row.label.trim())
          .map((row) => ({
            label: row.label.trim(),
            price: row.price,
            promoPrice: row.promoPrice,
          }))
      )
    );

    const result = product
      ? await updateProduct(product.id, product.image_url, undefined, formData)
      : await createProduct(undefined, formData);

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
      title={product ? "Editar produto" : "Novo produto"}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Preço"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Input
            label="Preço promocional"
            type="number"
            step="0.01"
            min="0"
            placeholder="Opcional"
            value={promoPrice}
            onChange={(e) => setPromoPrice(e.target.value)}
          />
        </div>

        <Input
          label="Quantidade mínima por pedido"
          type="number"
          step="1"
          min="1"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
          required
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-ink">
              Tamanhos (opcional)
            </label>
            <button
              type="button"
              onClick={addSizeRow}
              className="text-xs font-semibold text-brand"
            >
              + Adicionar tamanho
            </button>
          </div>
          <p className="mb-2 text-xs text-ink-soft">
            Se cadastrar tamanhos (ex: P, M, G), o preço acima deixa de ser
            usado no cardápio — o cliente escolhe o tamanho e paga o valor
            correspondente.
          </p>

          {sizeRows.length > 0 && (
            <div className="flex flex-col gap-2">
              {sizeRows.map((row, index) => (
                <div key={index} className="grid grid-cols-8 gap-2">
                  <input
                    placeholder="Ex: G"
                    value={row.label}
                    onChange={(e) =>
                      updateSizeRow(index, { label: e.target.value })
                    }
                    className="col-span-2 h-10 rounded-lg border border-ink/15 px-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Preço"
                    value={row.price}
                    onChange={(e) =>
                      updateSizeRow(index, { price: e.target.value })
                    }
                    className="col-span-3 h-10 rounded-lg border border-ink/15 px-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Promo (opcional)"
                    value={row.promoPrice}
                    onChange={(e) =>
                      updateSizeRow(index, { promoPrice: e.target.value })
                    }
                    className="col-span-2 h-10 rounded-lg border border-ink/15 px-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSizeRow(index)}
                    className="col-span-1 text-xs font-semibold text-brand"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Imagem
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink"
          />
          {product?.image_url && !imageFile && (
            <p className="mt-1 text-xs text-ink-soft">
              Já existe uma imagem. Envie um arquivo para substituí-la.
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Disponível
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Destaque
          </label>
        </div>

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {product ? "Salvar" : "Criar produto"}
        </Button>
      </form>
    </Modal>
  );
}
