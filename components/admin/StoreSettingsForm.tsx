"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { updateStoreSettings } from "@/app/admin/(dashboard)/configuracoes/actions";
import type { StoreSettings } from "@/lib/types";

export function StoreSettingsForm({ settings }: { settings: StoreSettings }) {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [whatsappNumber, setWhatsappNumber] = useState(
    settings.whatsapp_number
  );
  const [openingHours, setOpeningHours] = useState(settings.opening_hours);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState(
    settings.estimated_delivery_time
  );
  const [minOrderValue, setMinOrderValue] = useState(
    String(settings.min_order_value)
  );
  const [isOpen, setIsOpen] = useState(settings.is_open);
  const [promoText, setPromoText] = useState(settings.promo_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("store_name", storeName);
    formData.set("whatsapp_number", whatsappNumber);
    formData.set("opening_hours", openingHours);
    formData.set("estimated_delivery_time", estimatedDeliveryTime);
    formData.set("min_order_value", minOrderValue);
    formData.set("promo_text", promoText);
    if (isOpen) formData.set("is_open", "on");

    const result = await updateStoreSettings(undefined, formData);
    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-lg flex-col gap-4 rounded-2xl bg-white p-6 ring-1 ring-ink/10"
    >
      <Input
        label="Nome da loja"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        required
      />

      <Input
        label="Número do WhatsApp (com DDI e DDD, só números)"
        placeholder="5588900000000"
        value={whatsappNumber}
        onChange={(e) => setWhatsappNumber(e.target.value)}
        required
      />

      <Input
        label="Horário de funcionamento"
        placeholder="Seg a Dom, 18h às 23h"
        value={openingHours}
        onChange={(e) => setOpeningHours(e.target.value)}
      />

      <Input
        label="Tempo estimado de entrega"
        placeholder="30-45 min"
        value={estimatedDeliveryTime}
        onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
      />

      <Input
        label="Pedido mínimo (R$)"
        type="number"
        step="0.01"
        min="0"
        value={minOrderValue}
        onChange={(e) => setMinOrderValue(e.target.value)}
        required
      />

      <Textarea
        label="Texto do banner de promoção"
        placeholder="Deixe em branco para ocultar o banner"
        value={promoText}
        onChange={(e) => setPromoText(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isOpen}
          onChange={(e) => setIsOpen(e.target.checked)}
        />
        Loja aberta para pedidos
      </label>

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600" role="status">
          Configurações salvas com sucesso.
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Salvar configurações
      </Button>
    </form>
  );
}
