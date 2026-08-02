"use client";

import { useMemo, useState } from "react";
import { CartBar } from "@/components/public/CartBar";
import { CartDrawer } from "@/components/public/CartDrawer";
import { CategoryNav } from "@/components/public/CategoryNav";
import { CheckoutModal } from "@/components/public/CheckoutModal";
import { ProductGrid } from "@/components/public/ProductGrid";
import { SearchBar } from "@/components/public/SearchBar";
import { useCartStore } from "@/lib/store/cartStore";
import type { Category, Neighborhood, Product } from "@/lib/types";

export function MenuClient({
  categories,
  products,
  neighborhoods,
  whatsappNumber,
}: {
  categories: Category[];
  products: Product[];
  neighborhoods: Neighborhood[];
  whatsappNumber: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        !selectedCategoryId || product.category_id === selectedCategoryId;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategoryId]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryNav
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
        <ProductGrid
          categories={categories}
          products={filteredProducts}
          onAdd={(product) => addItem(product)}
        />
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <CartBar onOpen={() => setCartOpen(true)} />
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        neighborhoods={neighborhoods}
        whatsappNumber={whatsappNumber}
        onSuccess={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
