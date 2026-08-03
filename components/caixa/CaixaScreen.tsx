"use client";

import { useMemo, useState, type FormEvent } from "react";
import { addMovement, closeRegister, openRegister } from "@/app/caixa/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import {
  CASH_MOVEMENT_TYPE_LABELS,
  type CashMovement,
  type CashMovementType,
  type CashRegister,
  type PaymentMethodRow,
  type Payment,
} from "@/lib/types";

function OpenRegisterForm() {
  const [openingAmount, setOpeningAmount] = useState("0");
  const [openingNotes, setOpeningNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("opening_amount", openingAmount);
    formData.set("opening_notes", openingNotes);

    const result = await openRegister(undefined, formData);
    setIsSubmitting(false);

    if (result?.error) setError(result.error);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
        Abrir caixa
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink/10">
        <Input
          label="Valor inicial (R$)"
          type="number"
          step="0.01"
          min="0"
          value={openingAmount}
          onChange={(e) => setOpeningAmount(e.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Observações (opcional)"
          value={openingNotes}
          onChange={(e) => setOpeningNotes(e.target.value)}
        />
        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Abrir caixa
        </Button>
      </form>
    </div>
  );
}

function AddMovementForm({
  registerId,
  paymentMethods,
}: {
  registerId: string;
  paymentMethods: PaymentMethodRow[];
}) {
  const [type, setType] = useState<CashMovementType>("entrada");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showPaymentMethod = type === "entrada" || type === "suprimento";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("type", type);
    formData.set("amount", amount);
    formData.set("description", description);
    if (showPaymentMethod && paymentMethodId) {
      formData.set("payment_method_id", paymentMethodId);
    }

    const result = await addMovement(registerId, undefined, formData);
    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setAmount("");
    setDescription("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <p className="text-sm font-semibold text-ink">Nova movimentação</p>
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value as CashMovementType)}
        >
          <option value="entrada">Entrada</option>
          <option value="suprimento">Suprimento</option>
          <option value="saida">Saída</option>
          <option value="sangria">Sangria</option>
          <option value="estorno">Estorno</option>
        </Select>
        <Input
          label="Valor (R$)"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {showPaymentMethod && (
        <Select
          label="Forma (opcional, padrão dinheiro)"
          value={paymentMethodId}
          onChange={(e) => setPaymentMethodId(e.target.value)}
        >
          <option value="">Dinheiro</option>
          {paymentMethods
            .filter((m) => m.code !== "dinheiro")
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </Select>
      )}

      <Input
        label="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && (
        <p className="text-sm text-brand" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting} variant="outline" className="w-full">
        Registrar
      </Button>
    </form>
  );
}

function CloseRegisterModal({
  open,
  onClose,
  registerId,
  expectedCash,
}: {
  open: boolean;
  onClose: () => void;
  registerId: string;
  expectedCash: number;
}) {
  const [countedCash, setCountedCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const difference = (Number(countedCash) || 0) - expectedCash;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("counted_cash_amount", countedCash);
    formData.set("closing_notes", closingNotes);

    const result = await closeRegister(registerId, undefined, formData);
    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Fechar caixa">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Valor esperado em dinheiro:{" "}
          <span className="font-semibold text-ink">{formatCurrency(expectedCash)}</span>
        </p>

        <Input
          label="Valor contado em dinheiro (R$)"
          type="number"
          step="0.01"
          min="0"
          value={countedCash}
          onChange={(e) => setCountedCash(e.target.value)}
          required
          autoFocus
        />

        {countedCash !== "" && (
          <p className={`text-sm font-semibold ${difference === 0 ? "text-accent-green" : "text-brand"}`}>
            Diferença: {formatCurrency(difference)}
          </p>
        )}

        <Textarea
          label="Observações (opcional)"
          value={closingNotes}
          onChange={(e) => setClosingNotes(e.target.value)}
        />

        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Confirmar fechamento
        </Button>
      </form>
    </Modal>
  );
}

export function CaixaScreen({
  register,
  movements,
  payments,
  paymentMethods,
  expectedCash,
}: {
  register: CashRegister | null;
  movements: CashMovement[];
  payments: Payment[];
  paymentMethods: PaymentMethodRow[];
  expectedCash: number;
}) {
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  const salesByMethod = useMemo(() => {
    const paymentMethodById = new Map(paymentMethods.map((m) => [m.id, m]));
    const totals = new Map<string, number>();
    for (const payment of payments) {
      const name = paymentMethodById.get(payment.payment_method_id)?.name ?? "Outro";
      totals.set(name, (totals.get(name) ?? 0) + payment.amount);
    }
    return Array.from(totals.entries());
  }, [payments, paymentMethods]);

  const totalSales = payments.reduce((sum, p) => sum + p.amount, 0);
  const movementTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const movement of movements) {
      totals[movement.type] = (totals[movement.type] ?? 0) + movement.amount;
    }
    return totals;
  }, [movements]);

  if (!register) {
    return <OpenRegisterForm />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-wide text-ink">Caixa</h1>
          <p className="text-sm text-ink-soft">
            Aberto em {formatDateTime(register.opened_at)} · Valor inicial{" "}
            {formatCurrency(register.opening_amount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success">Aberto</Badge>
          <Button type="button" variant="outline" onClick={() => setCloseModalOpen(true)}>
            Fechar caixa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs text-ink-soft">Total de vendas</p>
          <p className="text-lg font-bold text-ink">{formatCurrency(totalSales)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs text-ink-soft">Esperado em dinheiro</p>
          <p className="text-lg font-bold text-ink">{formatCurrency(expectedCash)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs text-ink-soft">Entradas/Suprimentos</p>
          <p className="text-lg font-bold text-ink">
            {formatCurrency((movementTotals.entrada ?? 0) + (movementTotals.suprimento ?? 0))}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="text-xs text-ink-soft">Saídas/Sangrias</p>
          <p className="text-lg font-bold text-ink">
            {formatCurrency((movementTotals.saida ?? 0) + (movementTotals.sangria ?? 0))}
          </p>
        </div>
      </div>

      {salesByMethod.length > 0 && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Vendas por forma de pagamento</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {salesByMethod.map(([name, total]) => (
              <span key={name} className="text-ink-soft">
                {name}: <span className="font-semibold text-ink">{formatCurrency(total)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AddMovementForm registerId={register.id} paymentMethods={paymentMethods} />

        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Movimentações</p>
          {movements.length === 0 ? (
            <p className="text-sm text-ink-soft">Nenhuma movimentação registrada.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between border-b border-ink/5 pb-1.5">
                  <div>
                    <p className="text-ink">
                      {CASH_MOVEMENT_TYPE_LABELS[movement.type as CashMovementType]}
                      {movement.description ? ` — ${movement.description}` : ""}
                    </p>
                    <p className="text-xs text-ink-soft">{formatDateTime(movement.created_at)}</p>
                  </div>
                  <span className="font-semibold text-ink">{formatCurrency(movement.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <CloseRegisterModal
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        registerId={register.id}
        expectedCash={expectedCash}
      />
    </div>
  );
}
