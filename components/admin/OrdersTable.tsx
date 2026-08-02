"use client";

import { useState } from "react";
import {
  cancelOrder,
  deleteOrder,
  reopenOrder,
} from "@/app/admin/(dashboard)/pedidos/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import type { Neighborhood, Order, OrderItem } from "@/lib/types";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

export function OrdersTable({
  orders,
  items,
  neighborhoods,
}: {
  orders: Order[];
  items: OrderItem[];
  neighborhoods: Neighborhood[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const neighborhoodById = new Map(neighborhoods.map((n) => [n.id, n]));

  async function handleCancel(order: Order) {
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
          {orders.map((order) => (
            <details
              key={order.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-ink/10"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {order.customer_name}
                    </p>
                    {order.status === "cancelled" && (
                      <Badge tone="muted">Cancelado</Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft">
                    {formatDateTime(order.created_at)} ·{" "}
                    {neighborhoodById.get(order.neighborhood_id)?.name ??
                      "Bairro removido"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-ink">
                  {formatCurrency(order.total)}
                </span>
              </summary>

              <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3 text-sm text-ink-soft">
                <p>Telefone: {order.customer_phone}</p>
                <p>
                  Endereço: {order.street}, {order.number}
                  {order.complement ? ` - ${order.complement}` : ""}
                </p>
                {order.reference_point && (
                  <p>Ponto de referência: {order.reference_point}</p>
                )}
                <p>
                  Pagamento:{" "}
                  {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
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
                        {item.quantity}x {item.product_name} -{" "}
                        {formatCurrency(item.subtotal)}
                        {item.notes ? ` (${item.notes})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between border-t border-ink/10 pt-2 text-ink">
                  <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                  <span>Entrega: {formatCurrency(order.delivery_fee)}</span>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-3">
                  {order.status === "cancelled" ? (
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
          ))}
        </div>
      )}
    </div>
  );
}
