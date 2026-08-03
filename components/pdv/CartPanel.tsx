"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CartItemsList } from "@/components/pdv/CartItemsList";
import { createClient } from "@/lib/supabase/client";
import { posCartSubtotal, usePosCartStore } from "@/lib/store/posCartStore";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateChange, isSufficientCashPayment } from "@/lib/utils/payment";
import { ORDER_TYPE_LABELS, type CashRegister, type Neighborhood, type OrderType, type PaymentMethodRow } from "@/lib/types";

// Pedidos de mesa (comanda aberta) são tratados pelo TableOrderPanel - este
// componente cuida só dos tipos que são pagos na hora da criação.
type CartOrderType = Exclude<OrderType, "mesa">;

interface FinalizedOrder {
  orderId: string;
  orderNumber: number;
  total: number;
  changeAmount: number | null;
}

export function CartPanel({
  orderType,
  neighborhoods,
  paymentMethods,
  openRegister,
  requireOpenRegisterForCash,
}: {
  orderType: CartOrderType;
  neighborhoods: Neighborhood[];
  paymentMethods: PaymentMethodRow[];
  openRegister: CashRegister | null;
  requireOpenRegisterForCash: boolean;
}) {
  const items = usePosCartStore((s) => s.items);
  const clear = usePosCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [referencePoint, setReferencePoint] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalized, setFinalized] = useState<FinalizedOrder | null>(null);

  const subtotal = posCartSubtotal(items);
  const selectedNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId);
  const deliveryFee = orderType === "entrega" ? (selectedNeighborhood?.delivery_fee ?? 0) : 0;
  const discountValue = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(subtotal - discountValue + deliveryFee, 0);

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);
  const isCash = selectedMethod?.allows_change ?? false;
  const receivedValue = Number(receivedAmount) || 0;
  const changeAmount = isCash ? calculateChange(receivedValue, total) : 0;
  const cashBlocked =
    isCash && requireOpenRegisterForCash && !openRegister;

  async function handlePhoneBlur() {
    const phone = customerPhone.trim();
    if (phone.length < 8) return;

    setIsLookingUpCustomer(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();
    setIsLookingUpCustomer(false);

    if (data) {
      if (!customerName.trim()) setCustomerName(data.name);
      if (orderType === "entrega") {
        if (data.street && !street) setStreet(data.street);
        if (data.number && !number) setNumber(data.number);
        if (data.complement && !complement) setComplement(data.complement);
        if (data.reference_point && !referencePoint) setReferencePoint(data.reference_point);
        if (data.neighborhood_id && !neighborhoodId) setNeighborhoodId(data.neighborhood_id);
      }
    }
  }

  function resetForm() {
    clear();
    setCustomerName("");
    setCustomerPhone("");
    setStreet("");
    setNumber("");
    setComplement("");
    setReferencePoint("");
    setNeighborhoodId("");
    setPickupTime("");
    setNotes("");
    setDiscount("");
    setReceivedAmount("");
    setError(null);
  }

  async function handleFinalize() {
    setError(null);

    if (items.length === 0) {
      setError("Adicione ao menos um item ao pedido");
      return;
    }
    if (orderType === "entrega" && (!street.trim() || !number.trim() || !neighborhoodId)) {
      setError("Preencha endereço, número e bairro para entrega");
      return;
    }
    if (!paymentMethodId) {
      setError("Selecione uma forma de pagamento");
      return;
    }
    if (cashBlocked) {
      setError("Abra o caixa antes de receber pagamentos em dinheiro");
      return;
    }
    if (isCash && !isSufficientCashPayment(receivedValue, total)) {
      setError("Valor recebido não pode ser menor que o total");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      p_order_type: orderType,
      p_customer_name: customerName.trim() || null,
      p_customer_phone: customerPhone.trim() || null,
      p_table_number: null,
      p_street: orderType === "entrega" ? street.trim() : null,
      p_number: orderType === "entrega" ? number.trim() : null,
      p_complement: orderType === "entrega" ? complement.trim() || null : null,
      p_reference_point: orderType === "entrega" ? referencePoint.trim() || null : null,
      p_neighborhood_id: orderType === "entrega" ? neighborhoodId : null,
      p_pickup_at:
        orderType === "retirada" && pickupTime ? new Date(pickupTime).toISOString() : null,
      p_notes: notes.trim() || null,
      p_discount: discountValue,
      p_items: items.map((item) => ({
        product_id: item.productId,
        quantity: item.saleType === "weight" ? 1 : item.quantity,
        weight_grams: item.saleType === "weight" ? item.weightGrams : null,
        size_label: item.sizeLabel,
        second_product_id: item.secondProductId,
        notes: item.notes || null,
        modifiers: item.modifiers.map((m) => ({
          modifier_id: m.modifierId,
          quantity: m.quantity,
        })),
      })),
      p_payments: [
        {
          payment_method_id: paymentMethodId,
          amount: total,
          received_amount: isCash ? receivedValue : null,
        },
      ],
      p_cash_register_id: openRegister?.id ?? null,
    };

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_pos_order", payload);

    setIsSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const result = data?.[0];
    if (result) {
      setFinalized({
        orderId: result.order_id,
        orderNumber: result.order_number,
        total: result.total,
        changeAmount: isCash ? calculateChange(receivedValue, result.total) : null,
      });
      resetForm();
    }
  }

  if (finalized) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Badge tone="success">Pedido finalizado</Badge>
        <p className="font-display text-3xl text-ink">#{finalized.orderNumber}</p>
        <p className="text-sm text-ink-soft">Total: {formatCurrency(finalized.total)}</p>
        {finalized.changeAmount !== null && finalized.changeAmount > 0 && (
          <p className="text-sm text-ink-soft">
            Troco: {formatCurrency(finalized.changeAmount)}
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <a
            href={`/imprimir/${finalized.orderId}?tipo=comanda`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button type="button" variant="outline">
              Imprimir comanda
            </Button>
          </a>
          <a
            href={`/imprimir/${finalized.orderId}?tipo=comprovante`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button type="button" variant="outline">
              Imprimir comprovante
            </Button>
          </a>
        </div>
        <Button type="button" onClick={() => setFinalized(null)} className="mt-4">
          Novo pedido
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 bg-ink px-4 py-3">
        <h2 className="font-display text-lg uppercase tracking-wide text-white">
          Pedido — {ORDER_TYPE_LABELS[orderType]}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="bg-ink p-4">
        <CartItemsList />
      </div>

      <div className="flex flex-col gap-3 border-t border-ink/10 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Nome (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            label={orderType === "retirada" ? "Telefone" : "Telefone (opcional)"}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder={isLookingUpCustomer ? "Buscando..." : undefined}
          />
        </div>

        {orderType === "retirada" && (
          <Input
            label="Horário aproximado"
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
          />
        )}

        {orderType === "entrega" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  label="Rua"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Número"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            <Input
              label="Complemento (opcional)"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
            />
            <Input
              label="Ponto de referência (opcional)"
              value={referencePoint}
              onChange={(e) => setReferencePoint(e.target.value)}
            />
            <Select
              label="Bairro"
              value={neighborhoodId}
              onChange={(e) => setNeighborhoodId(e.target.value)}
              required
            >
              <option value="">Selecione o bairro</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} — {formatCurrency(n.delivery_fee)}
                </option>
              ))}
            </Select>
          </>
        )}

        <Textarea
          label="Observações (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Input
          label="Desconto (R$, opcional)"
          type="number"
          step="0.01"
          min="0"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />

        <div className="flex flex-col gap-1 border-t border-ink/10 pt-3 text-sm text-ink">
          <div className="flex justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-soft">Desconto</span>
              <span>- {formatCurrency(discountValue)}</span>
            </div>
          )}
          {orderType === "entrega" && (
            <div className="flex justify-between">
              <span className="text-ink-soft">Taxa de entrega</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
        </div>

        <Select
          label="Forma de pagamento"
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
        >
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </Select>

        {cashBlocked && (
          <p className="text-xs font-medium text-brand">
            Caixa fechado — abra o caixa para receber em dinheiro.
          </p>
        )}

        {isCash && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Valor recebido"
              type="number"
              step="0.01"
              min="0"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
            />
            <div className="flex flex-col justify-end pb-2.5">
              <p className="text-xs text-ink-soft">Troco</p>
              <p className="text-lg font-bold text-ink">{formatCurrency(changeAmount)}</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}
      </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 bg-ink px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Total</p>
          <p className="font-display text-2xl text-white">{formatCurrency(total)}</p>
        </div>
        <Button
          type="button"
          isLoading={isSubmitting}
          disabled={items.length === 0}
          onClick={handleFinalize}
          size="lg"
          className="flex-1"
        >
          Finalizar pedido
        </Button>
      </div>
    </div>
  );
}
