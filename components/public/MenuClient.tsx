"use client";

import { useMemo, useState } from "react";
import { CartBar } from "@/components/public/CartBar";
import { CartDrawer } from "@/components/public/CartDrawer";
import { CategoryNav } from "@/components/public/CategoryNav";
import { CheckoutModal } from "@/components/public/CheckoutModal";
import { ProductGrid } from "@/components/public/ProductGrid";
import { SearchBar } from "@/components/public/SearchBar";
import { SizeHalfModal } from "@/components/public/SizeHalfModal";
import { useCartStore } from "@/lib/store/cartStore";
import type { Category, Neighborhood, Product, ProductSize } from "@/lib/types";

export function MenuClient({
  categories,
  products,
  sizesByProduct,
  neighborhoods,
  whatsappNumber,
}: {
  categories: Category[];
  products: Product[];
  sizesByProduct: Record<string, ProductSize[]>;
  neighborhoods: Neighborhood[];
  whatsappNumber: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sizeModalProduct, setSizeModalProduct] = useState<Product | null>(
    null
  );
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

  function handleAdd(product: Product) {
    const sizes = sizesByProduct[product.id] ?? [];

    if (sizes.length > 0) {
      setSizeModalProduct(product);
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.promo_price ?? product.price,
      imageUrl: product.image_url,
      minQuantity: product.min_quantity,
    });
  }

  const sizeModalCategory = sizeModalProduct
    ? categories.find((c) => c.id === sizeModalProduct.category_id)
    : undefined;
  const sizeModalSiblings = sizeModalProduct
    ? products.filter((p) => p.category_id === sizeModalProduct.category_id)
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 pb-28">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryNav
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
        <ProductGrid
          categories={categories}
          products={filteredProducts}
          sizesByProduct={sizesByProduct}
          onAdd={handleAdd}
        />
      </div>

      <CartBar onOpen={() => setCartOpen(true)} />

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

      {sizeModalProduct && (
        <SizeHalfModal
          key={sizeModalProduct.id}
          open={!!sizeModalProduct}
          onClose={() => setSizeModalProduct(null)}
          product={sizeModalProduct}
          category={sizeModalCategory}
          sizes={sizesByProduct[sizeModalProduct.id] ?? []}
          siblingProducts={sizeModalSiblings}
          sizesByProduct={sizesByProduct}
        />
      )}
    </div>
  );
}
