import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product, ProductSize } from "@/lib/types";

export function PosProductCard({
  product,
  sizes,
  onSelect,
}: {
  product: Product;
  sizes: ProductSize[];
  onSelect: (product: Product) => void;
}) {
  const hasSizes = sizes.length > 0;
  const isWeight = product.pricing_type === "weight";
  const lowestSizePrice = hasSizes
    ? Math.min(...sizes.map((s) => s.promo_price ?? s.price))
    : null;
  const disabled = !product.available;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(product)}
      className="flex flex-col items-stretch gap-2 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-ink/5 transition-transform enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="160px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            🍔
          </div>
        )}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Badge tone="muted">Indisponível</Badge>
          </div>
        )}
      </div>

      <p className="truncate text-sm font-semibold text-ink">{product.name}</p>

      <p className="text-sm font-bold text-ink">
        {isWeight
          ? `${formatCurrency(product.price_per_kg ?? 0)}/kg`
          : hasSizes
            ? `A partir de ${formatCurrency(lowestSizePrice!)}`
            : formatCurrency(product.promo_price ?? product.price)}
      </p>
    </button>
  );
}
