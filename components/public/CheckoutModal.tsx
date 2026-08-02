"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cartSubtotal, useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { validateCheckoutForm } from "@/lib/utils/validation";
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { CheckoutFormData, Neighborhood, PaymentMethod } from "@/lib/types";

const EMPTY_FORM: CheckoutFormData = {
  customerName: "",
  customerPhone: "",
  street: "",
  number: "",
  complement: "",
  referencePoint: "",
  neighborhoodId: "",
  paymentMethod: "dinheiro",
  changeFor: "",
  notes: "",
};

export function CheckoutModal({
  open,
  onClose,
  neighborhoods,
  whatsappNumber,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  neighborhoods: Neighborhood[];
  whatsappNumber: string;
  onSuccess: () => void;
}) {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);

  const [form, setForm] = useState<CheckoutFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ReturnType<typeof validateCheckoutForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedNeighborhood = useMemo(
    () => neighborhoods.find((n) => n.id === form.neighborhoodId) ?? null,
    [neighborhoods, form.neighborhoodId]
  );

  const subtotal = cartSubtotal(items);
  const deliveryFee = selectedNeighborhood?.delivery_fee ?? 0;
  const total = subtotal + deliveryFee;

  function updateField<K extends keyof CheckoutFormData>(
    field: K,
    value: CheckoutFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateCheckoutForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0 || !selectedNeighborhood) {
      return;
    }

    setIsSubmitting(true);

    // Abre a aba em branco de forma síncrona (dentro do clique do usuário),
    // antes de qualquer "await" — navegadores bloqueiam window.open() quando
    // ele acontece depois de uma espera assíncrona, tratando como pop-up
    // indesejado. Preenchemos o endereço dela só depois que o pedido salvar.
    const whatsappTab = window.open("", "_blank", "noopener,noreferrer");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_order", {
        p_customer_name: form.customerName,
        p_customer_phone: form.customerPhone,
        p_street: form.street,
        p_number: form.number,
        p_complement: form.complement || null,
        p_reference_point: form.referencePoint || null,
        p_neighborhood_id: form.neighborhoodId,
        p_payment_method: form.paymentMethod,
        p_change_for:
          form.paymentMethod === "dinheiro" && form.changeFor.trim()
            ? Number(form.changeFor.replace(",", "."))
            : null,
        p_notes: form.notes || null,
        p_items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          notes: item.notes || null,
          size_label: item.sizeLabel,
          second_product_id: item.secondProductId,
        })),
      });

      if (error) {
        throw error;
      }

      const result = data?.[0];
      const message = buildOrderMessage({
        form,
        items,
        neighborhood: selectedNeighborhood,
        subtotal: result?.subtotal ?? subtotal,
        deliveryFee: result?.delivery_fee ?? deliveryFee,
        total: result?.total ?? total,
      });

      const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);
      if (whatsappTab) {
        whatsappTab.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      clearCart();
      setForm(EMPTY_FORM);
      onSuccess();
    } catch (err) {
      whatsappTab?.close();
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Não foi possível enviar o pedido. Tente novamente.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Finalizar pedido" className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          label="Nome"
          value={form.customerName}
          onChange={(e) => updateField("customerName", e.target.value)}
          error={errors.customerName}
        />
        <Input
          label="Telefone"
          type="tel"
          placeholder="(88) 9 9999-9999"
          value={form.customerPhone}
          onChange={(e) => updateField("customerPhone", e.target.value)}
          error={errors.customerPhone}
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Rua"
              value={form.street}
              onChange={(e) => updateField("street", e.target.value)}
              error={errors.street}
            />
          </div>
          <Input
            label="Número"
            value={form.number}
            onChange={(e) => updateField("number", e.target.value)}
            error={errors.number}
          />
        </div>

        <Input
          label="Complemento"
          value={form.complement}
          onChange={(e) => updateField("complement", e.target.value)}
        />
        <Input
          label="Ponto de referência"
          value={form.referencePoint}
          onChange={(e) => updateField("referencePoint", e.target.value)}
        />

        <Select
          label="Bairro"
          value={form.neighborhoodId}
          onChange={(e) => updateField("neighborhoodId", e.target.value)}
          error={errors.neighborhoodId}
        >
          <option value="">Selecione...</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} - {formatCurrency(n.delivery_fee)}
            </option>
          ))}
        </Select>

        <Select
          label="Forma de pagamento"
          value={form.paymentMethod}
          onChange={(e) =>
            updateField("paymentMethod", e.target.value as PaymentMethod)
          }
          error={errors.paymentMethod}
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="pix">Pix</option>
          <option value="cartao">Cartão</option>
        </Select>

        {form.paymentMethod === "dinheiro" && (
          <Input
            label="Troco para quanto?"
            placeholder="Deixe em branco se não precisar"
            value={form.changeFor}
            onChange={(e) => updateField("changeFor", e.target.value)}
            error={errors.changeFor}
          />
        )}

        <Textarea
          label="Observação geral"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
        />

        <div className="mt-2 flex flex-col gap-1 rounded-xl bg-surface p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Taxa de entrega</span>
            <span>
              {selectedNeighborhood ? formatCurrency(deliveryFee) : "-"}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-brand" role="alert">
            {submitError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Enviar pedido pelo WhatsApp
        </Button>
      </form>
    </Modal>
  );
}
