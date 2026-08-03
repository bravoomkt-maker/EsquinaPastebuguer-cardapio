"use client";

import { useMemo, useState } from "react";
import { CartPanel } from "@/components/pdv/CartPanel";
import { ModifiersModal } from "@/components/pdv/ModifiersModal";
import { PosCategorySidebar } from "@/components/pdv/PosCategorySidebar";
import { PosProductCard } from "@/components/pdv/PosProductCard";
import { PosTopBar } from "@/components/pdv/PosTopBar";
import { TableOrderPanel } from "@/components/pdv/TableOrderPanel";
import { WeightModal } from "@/components/pdv/WeightModal";
import { SearchBar } from "@/components/public/SearchBar";
import { usePosCartStore } from "@/lib/store/posCartStore";
import type {
  CashRegister,
  Category,
  Modifier,
  ModifierGroup,
  Neighborhood,
  OrderType,
  PaymentMethodRow,
  Product,
  ProductSize,
} from "@/lib/types";

export function PosScreen({
  categories,
  products,
  sizesByProduct,
  modifierGroups,
  modifiersByGroup,
  modifierGroupIdsByProduct,
  neighborhoods,
  paymentMethods,
  openRegister,
  requireOpenRegisterForCash,
  defaultMaxWeightGrams,
}: {
  categories: Category[];
  products: Product[];
  sizesByProduct: Record<string, ProductSize[]>;
  modifierGroups: ModifierGroup[];
  modifiersByGroup: Record<string, Modifier[]>;
  modifierGroupIdsByProduct: Record<string, string[]>;
  neighborhoods: Neighborhood[];
  paymentMethods: PaymentMethodRow[];
  openRegister: CashRegister | null;
  requireOpenRegisterForCash: boolean;
  currentUserId: string;
  defaultMaxWeightGrams: number;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("balcao");
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [modifiersProduct, setModifiersProduct] = useState<Product | null>(null);
  const addItem = usePosCartStore((s) => s.addItem);

  const posProducts = useMemo(
    () => products.filter((p) => p.visible_pos),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posProducts.filter((product) => {
      const matchesCategory =
        !selectedCategoryId || product.category_id === selectedCategoryId;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [posProducts, search, selectedCategoryId]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "";

  function handleSelectProduct(product: Product) {
    if (!product.available) return;

    if (product.pricing_type === "weight") {
      setWeightProduct(product);
      return;
    }

    const groupIds = modifierGroupIdsByProduct[product.id] ?? [];
    const groups = modifierGroups.filter((g) => groupIds.includes(g.id));

    if (product.allow_modifiers && groups.length > 0) {
      setModifiersProduct(product);
      return;
    }

    const sizes = sizesByProduct[product.id] ?? [];
    if (sizes.length > 0) {
      // PDV usa o menor tamanho como atalho rápido; tamanhos específicos
      // podem ser ajustados adicionando o item e editando pelo cardápio
      // completo em uma futura iteração.
      const cheapest = sizes.reduce((a, b) =>
        (a.promo_price ?? a.price) <= (b.promo_price ?? b.price) ? a : b
      );
      addItem({
        productId: product.id,
        name: product.name,
        saleType: "unit",
        weightGrams: null,
        pricePerKg: null,
        unitPrice: cheapest.promo_price ?? cheapest.price,
        sizeLabel: cheapest.label,
        secondProductId: null,
        notes: "",
        modifiers: [],
        imageUrl: product.image_url,
        categoryName: categoryName(product.category_id),
      });
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      saleType: "unit",
      weightGrams: null,
      pricePerKg: null,
      unitPrice: product.promo_price ?? product.price,
      sizeLabel: null,
      secondProductId: null,
      notes: "",
      modifiers: [],
      imageUrl: product.image_url,
      categoryName: categoryName(product.category_id),
    });
  }

  return (
    <div className="flex h-screen min-h-0 flex-col bg-surface">
      <PosTopBar orderType={orderType} onOrderTypeChange={setOrderType} />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <PosCategorySidebar
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <SearchBar value={search} onChange={setSearch} />
          <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <PosProductCard
                key={product.id}
                product={product}
                sizes={sizesByProduct[product.id] ?? []}
                onSelect={handleSelectProduct}
              />
            ))}
          </div>
        </div>

        <div className="flex min-h-0 w-full shrink-0 flex-col border-t border-ink/10 bg-white md:h-full md:w-96 md:border-l md:border-t-0">
          {orderType === "mesa" ? (
            <TableOrderPanel
              paymentMethods={paymentMethods}
              openRegister={openRegister}
              requireOpenRegisterForCash={requireOpenRegisterForCash}
            />
          ) : (
            <CartPanel
              orderType={orderType}
              neighborhoods={neighborhoods}
              paymentMethods={paymentMethods}
              openRegister={openRegister}
              requireOpenRegisterForCash={requireOpenRegisterForCash}
            />
          )}
        </div>
      </div>

      {weightProduct && (
        <WeightModal
          key={weightProduct.id}
          open
          onClose={() => setWeightProduct(null)}
          product={weightProduct}
          defaultMaxWeightGrams={defaultMaxWeightGrams}
          onConfirm={(weightGrams) => {
            addItem({
              productId: weightProduct.id,
              name: weightProduct.name,
              saleType: "weight",
              weightGrams,
              pricePerKg: weightProduct.price_per_kg,
              unitPrice: weightProduct.price_per_kg ?? 0,
              sizeLabel: null,
              secondProductId: null,
              notes: "",
              modifiers: [],
              imageUrl: weightProduct.image_url,
              categoryName: categoryName(weightProduct.category_id),
            });
            setWeightProduct(null);
          }}
        />
      )}

      {modifiersProduct && (
        <ModifiersModal
          key={modifiersProduct.id}
          open
          onClose={() => setModifiersProduct(null)}
          product={modifiersProduct}
          groups={modifierGroups.filter((g) =>
            (modifierGroupIdsByProduct[modifiersProduct.id] ?? []).includes(g.id)
          )}
          modifiersByGroup={modifiersByGroup}
          onConfirm={(modifiers, notes) => {
            addItem({
              productId: modifiersProduct.id,
              name: modifiersProduct.name,
              saleType: "unit",
              weightGrams: null,
              pricePerKg: null,
              unitPrice: modifiersProduct.promo_price ?? modifiersProduct.price,
              sizeLabel: null,
              secondProductId: null,
              notes,
              modifiers,
              imageUrl: modifiersProduct.image_url,
              categoryName: categoryName(modifiersProduct.category_id),
            });
            setModifiersProduct(null);
          }}
        />
      )}
    </div>
  );
}
