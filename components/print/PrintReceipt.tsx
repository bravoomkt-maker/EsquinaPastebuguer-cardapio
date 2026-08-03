"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import {
  ORDER_TYPE_LABELS,
  type Order,
  type OrderItem,
  type OrderItemModifier,
  type OrderType,
  type Payment,
} from "@/lib/types";

export type PaymentWithMethod = Payment & { payment_methods: { name: string } | null };

type PaperWidth = "58mm" | "80mm";

export function PrintReceipt({
  kind,
  order,
  items,
  modifiersByItem,
  storeName,
  neighborhoodName,
  defaultPaperWidth,
  payments,
}: {
  kind: "comanda" | "comprovante";
  order: Order;
  items: OrderItem[];
  modifiersByItem: Record<string, OrderItemModifier[]>;
  storeName: string;
  neighborhoodName: string | null;
  defaultPaperWidth: PaperWidth;
  payments: PaymentWithMethod[];
}) {
  const router = useRouter();
  const [width, setWidth] = useState<PaperWidth>(defaultPaperWidth);

  const orderTypeLabel =
    ORDER_TYPE_LABELS[order.order_type as OrderType] ?? order.order_type;
  const showCustomerName =
    order.order_type !== "balcao" || order.customer_name !== "Cliente balcão";

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <style>{`@page { size: ${width} auto; margin: 0; } @media print { .no-print { display: none !important; } body { margin: 0; } }`}</style>

      <div className="no-print flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <span className="text-sm font-semibold text-ink">Largura:</span>
        <div className="flex overflow-hidden rounded-full ring-1 ring-ink/15">
          <button
            type="button"
            onClick={() => setWidth("58mm")}
            className={`px-3 py-1.5 text-sm ${width === "58mm" ? "bg-brand text-white" : "text-ink-soft"}`}
          >
            58mm
          </button>
          <button
            type="button"
            onClick={() => setWidth("80mm")}
            className={`px-3 py-1.5 text-sm ${width === "80mm" ? "bg-brand text-white" : "text-ink-soft"}`}
          >
            80mm
          </button>
        </div>
        <Button type="button" size="sm" onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <div
        className="flex flex-col gap-2 bg-white p-3 font-mono text-[11px] leading-tight text-ink"
        style={{ width: width === "58mm" ? "58mm" : "80mm" }}
      >
        <div className="text-center">
          <p className="text-sm font-bold uppercase">{storeName}</p>
          <p>{kind === "comanda" ? "COMANDA - COZINHA" : "COMPROVANTE"}</p>
          <p>#{order.order_number} · {formatDateTime(order.created_at)}</p>
          <p className="font-bold uppercase">{orderTypeLabel}</p>
          {order.table_number && <p>Mesa/Comanda: {order.table_number}</p>}
        </div>

        <hr className="border-dashed border-ink" />

        {showCustomerName && <p>Cliente: {order.customer_name}</p>}
        {order.order_type === "entrega" && (
          <>
            <p>
              Endereço: {order.street}, {order.number}
              {order.complement ? ` - ${order.complement}` : ""}
            </p>
            {neighborhoodName && <p>Bairro: {neighborhoodName}</p>}
            {order.reference_point && <p>Ref: {order.reference_point}</p>}
          </>
        )}
        {order.order_type === "retirada" && order.pickup_at && (
          <p>Retirar às: {formatDateTime(order.pickup_at)}</p>
        )}

        <hr className="border-dashed border-ink" />

        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.id}>
              <p className="font-bold">
                {item.sale_type === "weight" ? `${item.weight_grams} g` : `${item.quantity}x`}{" "}
                {item.product_name}
                {kind === "comprovante" && (
                  <span className="float-right">{formatCurrency(item.subtotal)}</span>
                )}
              </p>
              {item.sale_type === "weight" && kind === "comprovante" && (
                <p className="pl-2">Preço/kg: {formatCurrency(item.price_per_kg ?? 0)}</p>
              )}
              {(modifiersByItem[item.id] ?? []).map((modifier) => (
                <p key={modifier.id} className="pl-2">
                  + {modifier.quantity}x {modifier.modifier_name}
                  {kind === "comprovante" && (
                    <span className="float-right">
                      {formatCurrency(modifier.price * modifier.quantity)}
                    </span>
                  )}
                </p>
              ))}
              {item.notes && <p className="pl-2 italic">Obs: {item.notes}</p>}
            </div>
          ))}
        </div>

        {order.notes && (
          <>
            <hr className="border-dashed border-ink" />
            <p>Obs. geral: {order.notes}</p>
          </>
        )}

        {kind === "comprovante" && (
          <>
            <hr className="border-dashed border-ink" />
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
            {order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(order.total)}</span>
            </div>

            <hr className="border-dashed border-ink" />
            {payments.map((payment) => (
              <div key={payment.id}>
                <div className="flex justify-between">
                  <span>{payment.payment_methods?.name ?? "Pagamento"}</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
                {payment.received_amount != null && (
                  <div className="flex justify-between text-ink/70">
                    <span>Recebido</span>
                    <span>{formatCurrency(payment.received_amount)}</span>
                  </div>
                )}
                {payment.change_amount != null && payment.change_amount > 0 && (
                  <div className="flex justify-between text-ink/70">
                    <span>Troco</span>
                    <span>{formatCurrency(payment.change_amount)}</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <hr className="border-dashed border-ink" />
        <p className="text-center">Esquina Pasteburguer — obrigado pela preferência!</p>
      </div>
    </div>
  );
}
