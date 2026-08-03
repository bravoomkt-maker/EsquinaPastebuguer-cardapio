"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  markReady,
  reopenToPreparing,
  startPreparing,
} from "@/app/cozinha/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { ORDER_TYPE_LABELS } from "@/lib/types";
import type { KitchenOrder } from "@/components/cozinha/types";

const OVERDUE_MINUTES = 15;

function minutesSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / 60000);
}

function OrderCard({ order, now }: { order: KitchenOrder; now: number }) {
  const [pending, setPending] = useState(false);
  const elapsed = minutesSince(order.createdAt, now);
  const overdue = elapsed >= OVERDUE_MINUTES && order.status !== "ready";

  async function run(action: (id: string) => Promise<{ error?: string } | undefined>) {
    setPending(true);
    await action(order.id);
    setPending(false);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1",
        overdue ? "ring-2 ring-brand" : "ring-ink/10"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg text-ink">#{order.orderNumber}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">
              {ORDER_TYPE_LABELS[order.orderType as keyof typeof ORDER_TYPE_LABELS] ??
                order.orderType}
            </Badge>
            {order.tableNumber && <Badge tone="muted">Mesa {order.tableNumber}</Badge>}
          </div>
        </div>
        <Badge tone={overdue ? "brand" : "muted"}>{elapsed} min</Badge>
      </div>

      {order.customerName && order.customerName !== "Cliente balcão" && (
        <p className="text-sm text-ink-soft">{order.customerName}</p>
      )}

      <ul className="flex flex-col gap-1.5 border-t border-ink/10 pt-2 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            <p className="font-medium text-ink">
              {item.saleType === "weight" ? `${item.weightGrams} g` : `${item.quantity}x`}{" "}
              {item.productName}
            </p>
            {item.modifiers.length > 0 && (
              <p className="pl-3 text-xs text-ink-soft">
                {item.modifiers.map((m) => `${m.quantity}x ${m.name}`).join(", ")}
              </p>
            )}
            {item.notes && <p className="pl-3 text-xs italic text-brand">{item.notes}</p>}
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="border-t border-ink/10 pt-2 text-xs italic text-ink-soft">
          Obs. geral: {order.notes}
        </p>
      )}

      <div className="border-t border-ink/10 pt-2">
        {(order.status === "pending" || order.status === "confirmed") && (
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => run(startPreparing)}
          >
            Iniciar preparação
          </Button>
        )}
        {order.status === "preparing" && (
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => run(markReady)}
          >
            Marcar como pronto
          </Button>
        )}
        {order.status === "ready" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => run(reopenToPreparing)}
          >
            Reabrir
          </Button>
        )}
      </div>
    </div>
  );
}

export function KitchenBoard({ orders }: { orders: KitchenOrder[] }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-orders-watcher")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const columns: { title: string; statuses: KitchenOrder["status"][] }[] = [
    { title: "Novos", statuses: ["pending", "confirmed"] },
    { title: "Em preparação", statuses: ["preparing"] },
    { title: "Prontos", statuses: ["ready"] },
  ];

  return (
    <div className="flex h-screen flex-col gap-4 p-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">Cozinha</h1>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-3">
        {columns.map((column) => {
          const columnOrders = orders.filter((o) => column.statuses.includes(o.status));
          return (
            <div key={column.title} className="flex flex-col gap-3 overflow-y-auto">
              <div className="sticky top-0 flex items-center justify-between rounded-xl bg-ink px-3 py-2 text-white">
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {column.title}
                </span>
                <Badge tone="muted" className="bg-white/15 text-white">
                  {columnOrders.length}
                </Badge>
              </div>
              {columnOrders.length === 0 ? (
                <p className="text-center text-sm text-ink-soft">Nenhum pedido</p>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard key={order.id} order={order} now={now} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
