"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { updatePosSettings } from "@/app/admin/(dashboard)/configuracoes/actions";
import type { AppSettings, PrinterSettings } from "@/lib/types";

export function PosSettingsForm({
  appSettings,
  printerSettings,
}: {
  appSettings: AppSettings;
  printerSettings: PrinterSettings;
}) {
  const [requireOpenRegister, setRequireOpenRegister] = useState(
    appSettings.require_open_register_for_cash
  );
  const [defaultMaxWeightGrams, setDefaultMaxWeightGrams] = useState(
    String(appSettings.default_max_weight_grams)
  );
  const [paperWidth, setPaperWidth] = useState(printerSettings.paper_width);
  const [printKitchenCopy, setPrintKitchenCopy] = useState(
    printerSettings.print_kitchen_copy
  );
  const [printCustomerReceipt, setPrintCustomerReceipt] = useState(
    printerSettings.print_customer_receipt
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData();
    if (requireOpenRegister) formData.set("require_open_register_for_cash", "on");
    formData.set("default_max_weight_grams", defaultMaxWeightGrams);
    formData.set("paper_width", paperWidth);
    if (printKitchenCopy) formData.set("print_kitchen_copy", "on");
    if (printCustomerReceipt) formData.set("print_customer_receipt", "on");

    const result = await updatePosSettings(undefined, formData);
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
      <h2 className="font-display text-lg uppercase tracking-wide text-ink">
        PDV e impressão
      </h2>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={requireOpenRegister}
          onChange={(e) => setRequireOpenRegister(e.target.checked)}
        />
        Exigir caixa aberto para receber pagamentos em dinheiro
      </label>

      <Input
        label="Peso máximo padrão por venda (g)"
        type="number"
        step="1"
        min="1"
        value={defaultMaxWeightGrams}
        onChange={(e) => setDefaultMaxWeightGrams(e.target.value)}
        required
      />
      <p className="-mt-2 text-xs text-ink-soft">
        Usado quando o produto por peso não tem um limite próprio cadastrado.
      </p>

      <Select
        label="Largura do papel da impressora"
        value={paperWidth}
        onChange={(e) => setPaperWidth(e.target.value as "58mm" | "80mm")}
      >
        <option value="80mm">80mm</option>
        <option value="58mm">58mm</option>
      </Select>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={printKitchenCopy}
          onChange={(e) => setPrintKitchenCopy(e.target.checked)}
        />
        Imprimir comanda da cozinha por padrão
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={printCustomerReceipt}
          onChange={(e) => setPrintCustomerReceipt(e.target.checked)}
        />
        Imprimir comprovante do cliente por padrão
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
        Salvar configurações do PDV
      </Button>
    </form>
  );
}
