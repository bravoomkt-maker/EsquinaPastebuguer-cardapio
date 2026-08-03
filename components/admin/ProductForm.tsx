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
import type { Category, ModifierGroup, Product, ProductSize } from "@/lib/types";

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
  modifierGroups,
  selectedModifierGroupIds,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  product?: Product;
  sizes?: ProductSize[];
  modifierGroups: ModifierGroup[];
  selectedModifierGroupIds: string[];
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? categories[0]?.id ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [internalCode, setInternalCode] = useState(product?.internal_code ?? "");
  const [pricingType, setPricingType] = useState<"unit" | "weight">(
    (product?.pricing_type as "unit" | "weight") ?? "unit"
  );
  const [price, setPrice] = useState(product && product.pricing_type !== "weight" ? String(product.price) : "");
  const [promoPrice, setPromoPrice] = useState(
    product?.promo_price ? String(product.promo_price) : ""
  );
  const [pricePerKg, setPricePerKg] = useState(
    product?.price_per_kg ? String(product.price_per_kg) : ""
  );
  const [maxWeightGrams, setMaxWeightGrams] = useState(
    product?.max_weight_grams ? String(product.max_weight_grams) : "2000"
  );
  const [available, setAvailable] = useState(product?.available ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [trackStock, setTrackStock] = useState(product?.track_stock ?? false);
  const [stockQuantity, setStockQuantity] = useState(
    String(product?.stock_quantity ?? 0)
  );
  const [allowModifiers, setAllowModifiers] = useState(
    product?.allow_modifiers ?? true
  );
  const [allowNotes, setAllowNotes] = useState(product?.allow_notes ?? true);
  const [visibleMenu, setVisibleMenu] = useState(product?.visible_menu ?? true);
  const [visiblePos, setVisiblePos] = useState(product?.visible_pos ?? true);
  const [minQuantity, setMinQuantity] = useState(
    String(product?.min_quantity ?? 1)
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    selectedModifierGroupIds
  );
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

  function toggleGroup(groupId: string) {
    setSelectedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("category_id", categoryId);
    formData.set("description", description);
    formData.set("internal_code", internalCode);
    formData.set("pricing_type", pricingType);
    formData.set("price", price);
    formData.set("promo_price", promoPrice);
    formData.set("price_per_kg", pricePerKg);
    formData.set("max_weight_grams", maxWeightGrams);
    formData.set("min_quantity", minQuantity);
    formData.set("stock_quantity", stockQuantity);
    if (available) formData.set("available", "on");
    if (featured) formData.set("featured", "on");
    if (trackStock) formData.set("track_stock", "on");
    if (allowModifiers) formData.set("allow_modifiers", "on");
    if (allowNotes) formData.set("allow_notes", "on");
    if (visibleMenu) formData.set("visible_menu", "on");
    if (visiblePos) formData.set("visible_pos", "on");
    if (imageFile) formData.set("image", imageFile);
    formData.set("modifier_group_ids", JSON.stringify(selectedGroups));
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

        <div className="grid grid-cols-2 gap-3">
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
          <Input
            label="Código interno (opcional)"
            value={internalCode}
            onChange={(e) => setInternalCode(e.target.value)}
          />
        </div>

        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Select
          label="Tipo de venda"
          value={pricingType}
          onChange={(e) => setPricingType(e.target.value as "unit" | "weight")}
        >
          <option value="unit">Por unidade</option>
          <option value="weight">Por peso (kg)</option>
        </Select>

        {pricingType === "weight" ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço por quilo (R$)"
              type="number"
              step="0.01"
              min="0"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              required
            />
            <Input
              label="Peso máximo por venda (g)"
              type="number"
              step="1"
              min="1"
              value={maxWeightGrams}
              onChange={(e) => setMaxWeightGrams(e.target.value)}
            />
          </div>
        ) : (
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
        )}

        <Input
          label="Quantidade mínima por pedido (cardápio digital)"
          type="number"
          step="1"
          min="1"
          value={minQuantity}
          onChange={(e) => setMinQuantity(e.target.value)}
          required
        />

        {pricingType === "unit" && (
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
        )}

        {modifierGroups.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Grupos de adicionais
            </label>
            <div className="flex flex-col gap-1.5 rounded-lg border border-ink/15 p-3">
              {modifierGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                  />
                  {group.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
            />
            Controlar estoque
          </label>
          {trackStock && (
            <Input
              type="number"
              step="1"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
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

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={allowModifiers}
              onChange={(e) => setAllowModifiers(e.target.checked)}
            />
            Permite adicionais
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={allowNotes}
              onChange={(e) => setAllowNotes(e.target.checked)}
            />
            Permite observações
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={visibleMenu}
              onChange={(e) => setVisibleMenu(e.target.checked)}
            />
            Visível no cardápio digital
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={visiblePos}
              onChange={(e) => setVisiblePos(e.target.checked)}
            />
            Visível no PDV
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
