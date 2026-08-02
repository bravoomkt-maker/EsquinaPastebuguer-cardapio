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
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const neighborhoodById = new Map(neighborhoods.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Pedidos
      </h1>

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
                  <p className="truncate text-sm font-semibold text-ink">
                    {order.customer_name}
                  </p>
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
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
