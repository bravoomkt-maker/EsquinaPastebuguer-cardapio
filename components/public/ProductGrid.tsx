import { ProductCard } from "@/components/public/ProductCard";
import type { Category, Product, ProductSize } from "@/lib/types";

export function ProductGrid({
  categories,
  products,
  sizesByProduct,
  onAdd,
}: {
  categories: Category[];
  products: Product[];
  sizesByProduct: Record<string, ProductSize[]>;
  onAdd?: (product: Product) => void;
}) {
  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-white/60">
        Nenhum produto encontrado.
      </p>
    );
  }

  const groups = categories
    .map((category) => ({
      category,
      items: products.filter((product) => product.category_id === category.id),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ category, items }) => (
        <section key={category.id}>
          <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-white">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sizes={sizesByProduct[product.id] ?? []}
                onAdd={onAdd}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
