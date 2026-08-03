"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelOrder,
  deleteOrder,
  reopenOrder,
  updateOrderStatus,
} from "@/app/admin/(dashboard)/pedidos/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type Neighborhood,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/lib/types";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  entrega: "Pagamento na entrega",
};

const STATUS_BADGE_TONE: Record<OrderStatus, "muted" | "accent" | "success" | "brand"> = {
  pending: "accent",
  confirmed: "brand",
  preparing: "brand",
  ready: "success",
  out_for_delivery: "success",
  delivered: "muted",
  cancelled: "muted",
};

function nextStatus(order: Order): OrderStatus | null {
  switch (order.status as OrderStatus) {
    case "pending":
      return "confirmed";
    case "confirmed":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return order.order_type === "entrega" ? "out_for_delivery" : "delivered";
    case "out_for_delivery":
      return "delivered";
    default:
      return null;
  }
}

export function OrdersTable({
  orders,
  items,
  neighborhoods,
}: {
  orders: Order[];
  items: OrderItem[];
  neighborhoods: Neighborhood[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders-watcher")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const neighborhoodById = new Map(neighborhoods.map((n) => [n.id, n]));

  async function handleAdvance(order: Order) {
    const status = nextStatus(order);
    if (!status) return;
    setPendingId(order.id);
    setError(null);
    const result = await updateOrderStatus(order.id, status);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleCancel(order: Order) {
    if (!confirm(`Cancelar o pedido #${order.order_number}?`)) return;
    setPendingId(order.id);
    setError(null);
    const result = await cancelOrder(order.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleReopen(order: Order) {
    setPendingId(order.id);
    setError(null);
    const result = await reopenOrder(order.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleDelete(order: Order) {
    if (!confirm(`Excluir o pedido de "${order.customer_name}" definitivamente?`))
      return;
    setPendingId(order.id);
    setError(null);
    const result = await deleteOrder(order.id);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Pedidos
      </h1>

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft ring-1 ring-ink/10">
          Nenhum pedido registrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const status = order.status as OrderStatus;
            const advanceTo = nextStatus(order);

            return (
              <details
                key={order.id}
                className="rounded-2xl bg-white p-4 ring-1 ring-ink/10"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        #{order.order_number} · {order.customer_name}
                      </p>
                      <Badge tone="muted">
                        {ORDER_TYPE_LABELS[order.order_type as keyof typeof ORDER_TYPE_LABELS] ??
                          order.order_type}
                      </Badge>
                      <Badge tone={STATUS_BADGE_TONE[status] ?? "muted"}>
                        {ORDER_STATUS_LABELS[status] ?? order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-soft">
                      {formatDateTime(order.created_at)}
                      {order.neighborhood_id &&
                        ` · ${neighborhoodById.get(order.neighborhood_id)?.name ?? "Bairro removido"}`}
                      {order.table_number && ` · Mesa/comanda ${order.table_number}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink">
                    {formatCurrency(order.total)}
                  </span>
                </summary>

                <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3 text-sm text-ink-soft">
                  <p>Telefone: {order.customer_phone}</p>
                  {order.street && (
                    <p>
                      Endereço: {order.street}, {order.number}
                      {order.complement ? ` - ${order.complement}` : ""}
                    </p>
                  )}
                  {order.reference_point && (
                    <p>Ponto de referência: {order.reference_point}</p>
                  )}
                  <p>
                    Pagamento:{" "}
                    {order.payment_method
                      ? (PAYMENT_LABELS[order.payment_method] ?? order.payment_method)
                      : "-"}
                    {order.change_for
                      ? ` (troco para ${formatCurrency(order.change_for)})`
                      : ""}
                  </p>
                  {order.notes && <p>Observação: {order.notes}</p>}

                  <div>
                    <p className="font-semibold text-ink">Itens</p>
                    <ul className="mt-1 list-disc pl-5">
                      {(itemsByOrder.get(order.id) ?? []).map((item) => (
                        <li key={item.id}>
                          {item.sale_type === "weight"
                            ? `${item.weight_grams} g`
                            : `${item.quantity}x`}{" "}
                          {item.product_name} - {formatCurrency(item.subtotal)}
                          {item.notes ? ` (${item.notes})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-1 border-t border-ink/10 pt-2 text-ink">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Desconto</span>
                        <span>- {formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Entrega</span>
                      <span>{formatCurrency(order.delivery_fee)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                    {status === "cancelled" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pendingId === order.id}
                        onClick={() => handleReopen(order)}
                      >
                        Reabrir pedido
                      </Button>
                    ) : (
                      <>
                        {advanceTo && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={pendingId === order.id}
                            onClick={() => handleAdvance(order)}
                          >
                            {ORDER_STATUS_LABELS[advanceTo]}
                          </Button>
                        )}
                        {status !== "delivered" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pendingId === order.id}
                            onClick={() => handleCancel(order)}
                          >
                            Cancelar pedido
                          </Button>
                        )}
                      </>
                    )}
                    <a href={`/imprimir/${order.id}?tipo=comanda`} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="outline" size="sm">
                        Comanda
                      </Button>
                    </a>
                    <a href={`/imprimir/${order.id}?tipo=comprovante`} target="_blank" rel="noopener noreferrer">
                      <Button type="button" variant="outline" size="sm">
                        Comprovante
                      </Button>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={pendingId === order.id}
                      onClick={() => handleDelete(order)}
                    >
                      Excluir definitivamente
                    </Button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
