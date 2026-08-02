import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
}) {
  const hasPromo = product.promo_price !== null;

  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-ink/5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🍔
          </div>
        )}
        {product.featured && (
          <Badge tone="accent" className="absolute left-1 top-1">
            Destaque
          </Badge>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate text-sm font-semibold text-ink">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {!product.available ? (
              <Badge tone="muted">Indisponível</Badge>
            ) : hasPromo ? (
              <>
                <span className="text-xs text-ink-soft line-through">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-sm font-bold text-brand">
                  {formatCurrency(product.promo_price!)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-ink">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={!product.available}
            onClick={() => onAdd?.(product)}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
