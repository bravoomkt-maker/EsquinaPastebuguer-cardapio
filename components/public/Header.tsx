import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { StoreSettings } from "@/lib/types";

export function Header({ settings }: { settings: StoreSettings }) {
  return (
    <header className="sticky top-0 z-40 bg-brand">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/10">
          <Image
            src={settings.logo_url || "/logo-icon.png"}
            alt={settings.store_name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg uppercase tracking-wide text-white">
            {settings.store_name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/80">
            {settings.opening_hours && <span>{settings.opening_hours}</span>}
            {settings.estimated_delivery_time && (
              <>
                <span aria-hidden="true">•</span>
                <span>Entrega em {settings.estimated_delivery_time}</span>
              </>
            )}
          </div>
        </div>

        <Badge tone={settings.is_open ? "success" : "ink"}>
          {settings.is_open ? "Aberto" : "Fechado"}
        </Badge>
      </div>
    </header>
  );
}
