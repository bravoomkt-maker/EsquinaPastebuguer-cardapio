"use client";

import { useEffect, useState } from "react";
import { CartItemsList } from "@/components/pdv/CartItemsList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createClient } from "@/lib/supabase/client";
import { posCartSubtotal, usePosCartStore } from "@/lib/store/posCartStore";
import { formatCurrency } from "@/lib/utils/currency";
import { calculateChange, isSufficientCashPayment } from "@/lib/utils/payment";
import type { CashRegister, PaymentMethodRow } from "@/lib/types";

interface OpenTable {
  id: string;
  order_number: number;
  table_number: string;
  subtotal: number;
  created_at: string;
}

interface TableOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  sale_type: string;
  weight_grams: number | null;
  subtotal: number;
  notes: string | null;
}

interface FinalizedTable {
  orderNumber: number;
  total: number;
  changeAmount: number | null;
}

type View = "list" | "building" | "closing" | "details";

export function TableOrderPanel({
  paymentMethods,
  openRegister,
  requireOpenRegisterForCash,
}: {
  paymentMethods: PaymentMethodRow[];
  openRegister: CashRegister | null;
  requireOpenRegisterForCash: boolean;
}) {
  const items = usePosCartStore((s) => s.items);
  const clear = usePosCartStore((s) => s.clear);
  const subtotal = posCartSubtotal(items);

  const [view, setView] = useState<View>("list");
  const [openTables, setOpenTables] = useState<OpenTable[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [activeTable, setActiveTable] = useState<OpenTable | null>(null);

  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalized, setFinalized] = useState<FinalizedTable | null>(null);
  const [finalizedOrderId, setFinalizedOrderId] = useState<string | null>(null);

  const [tableItems, setTableItems] = useState<TableOrderItem[]>([]);
  const [tableItemModifiers, setTableItemModifiers] = useState<
    Record<string, { name: string; quantity: number }[]>
  >({});
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  async function loadOpenTables() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, table_number, subtotal, created_at")
      .eq("order_type", "mesa")
      .eq("is_open_tab", true)
      .order("created_at", { ascending: true });
    setOpenTables((data ?? []) as OpenTable[]);
    setIsLoadingTables(false);
  }

  useEffect(() => {
    // Busca as mesas abertas ao montar e reassina sempre que orders mudar
    // via Realtime; o setState só acontece depois do await dentro de
    // loadOpenTables, não sincronamente no corpo do efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOpenTables();

    const supabase = createClient();
    const channel = supabase
      .channel("pdv-open-tables")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: "order_type=eq.mesa" },
        () => void loadOpenTables()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function startNewTable() {
    if (!newTableNumber.trim()) {
      setError("Informe o número da mesa");
      return;
    }
    setError(null);
    setActiveTable(null);
    clear();
    setView("building");
  }

  function resumeTable(table: OpenTable) {
    setError(null);
    setActiveTable(table);
    setNewTableNumber(table.table_number);
    clear();
    setView("building");
  }

  function goToClose(table: OpenTable) {
    setError(null);
    setActiveTable(table);
    setDiscount("");
    setReceivedAmount("");
    setView("closing");
  }

  async function openDetails(table: OpenTable) {
    setError(null);
    setActiveTable(table);
    setView("details");
    setIsLoadingItems(true);

    const supabase = createClient();
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id, product_name, quantity, sale_type, weight_grams, subtotal, notes")
      .eq("order_id", table.id)
      .order("id", { ascending: true });

    const itemIds = (orderItems ?? []).map((i) => i.id);
    const { data: modifiers } = itemIds.length
      ? await supabase
          .from("order_item_modifiers")
          .select("id, order_item_id, modifier_name, quantity")
          .in("order_item_id", itemIds)
      : { data: [] };

    const grouped: Record<string, { name: string; quantity: number }[]> = {};
    for (const m of modifiers ?? []) {
      (grouped[m.order_item_id] ??= []).push({ name: m.modifier_name, quantity: m.quantity });
    }

    setTableItems((orderItems ?? []) as TableOrderItem[]);
    setTableItemModifiers(grouped);
    setIsLoadingItems(false);
  }

  async function handleRemoveItem(itemId: string, itemName: string) {
    if (!confirm(`Cancelar "${itemName}"?`)) return;

    setRemovingItemId(itemId);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("remove_item_from_table_order", {
      p_order_item_id: itemId,
    });

    setRemovingItemId(null);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setTableItems((current) => current.filter((i) => i.id !== itemId));

    const result = data?.[0];
    if (result) {
      setActiveTable((current) => (current ? { ...current, subtotal: result.subtotal } : current));
    }

    await loadOpenTables();
  }

  async function handleSendToKitchen() {
    if (items.length === 0) {
      setError("Adicione ao menos um item");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const itemsPayload = items.map((item) => ({
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
    }));

    const supabase = createClient();

    if (activeTable) {
      const { error: rpcError } = await supabase.rpc("add_items_to_table_order", {
        p_order_id: activeTable.id,
        p_items: itemsPayload,
      });
      setIsSubmitting(false);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
    } else {
      const { error: rpcError } = await supabase.rpc("open_table_order", {
        p_table_number: newTableNumber.trim(),
        p_customer_name: null,
        p_notes: null,
        p_items: itemsPayload,
      });
      setIsSubmitting(false);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
    }

    clear();
    setActiveTable(null);
    setNewTableNumber("");
    await loadOpenTables();
    setView("list");
  }

  const discountValue = activeTable ? Math.min(Number(discount) || 0, activeTable.subtotal) : 0;
  const closeTotal = activeTable ? Math.max(activeTable.subtotal - discountValue, 0) : 0;
  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);
  const isCash = selectedMethod?.allows_change ?? false;
  const receivedValue = Number(receivedAmount) || 0;
  const changeAmount = isCash ? calculateChange(receivedValue, closeTotal) : 0;
  const cashBlocked = isCash && requireOpenRegisterForCash && !openRegister;

  async function handleCloseTable() {
    if (!activeTable) return;
    setError(null);

    if (!paymentMethodId) {
      setError("Selecione uma forma de pagamento");
      return;
    }
    if (cashBlocked) {
      setError("Abra o caixa antes de receber pagamentos em dinheiro");
      return;
    }
    if (isCash && !isSufficientCashPayment(receivedValue, closeTotal)) {
      setError("Valor recebido não pode ser menor que o total");
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("close_table_order", {
      p_order_id: activeTable.id,
      p_discount: discountValue,
      p_notes: notes.trim() || null,
      p_payments: [
        {
          payment_method_id: paymentMethodId,
          amount: closeTotal,
          received_amount: isCash ? receivedValue : null,
        },
      ],
      p_cash_register_id: openRegister?.id ?? null,
    });

    setIsSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const result = data?.[0];
    if (result) {
      setFinalizedOrderId(activeTable.id);
      setFinalized({
        orderNumber: result.order_number,
        total: result.total,
        changeAmount: isCash ? calculateChange(receivedValue, result.total) : null,
      });
      setActiveTable(null);
      setNotes("");
      setDiscount("");
      setReceivedAmount("");
      await loadOpenTables();
    }
  }

  if (finalized) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <Badge tone="success">Mesa fechada</Badge>
        <p className="font-display text-3xl text-ink">#{finalized.orderNumber}</p>
        <p className="text-sm text-ink-soft">Total: {formatCurrency(finalized.total)}</p>
        {finalized.changeAmount !== null && finalized.changeAmount > 0 && (
          <p className="text-sm text-ink-soft">
            Troco: {formatCurrency(finalized.changeAmount)}
          </p>
        )}
        {finalizedOrderId && (
          <div className="mt-2 flex gap-2">
            <a href={`/imprimir/${finalizedOrderId}?tipo=comanda`} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline">
                Imprimir comanda
              </Button>
            </a>
            <a href={`/imprimir/${finalizedOrderId}?tipo=comprovante`} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline">
                Imprimir comprovante
              </Button>
            </a>
          </div>
        )}
        <Button
          type="button"
          onClick={() => {
            setFinalized(null);
            setFinalizedOrderId(null);
            setView("list");
          }}
          className="mt-4"
        >
          Voltar para as mesas
        </Button>
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 bg-ink px-4 py-3">
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Mesas abertas
          </h2>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Número da mesa"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
            />
            <Button type="button" onClick={startNewTable}>
              Nova mesa
            </Button>
          </div>

          {error && (
            <p className="text-sm text-brand" role="alert">
              {error}
            </p>
          )}

          {isLoadingTables ? (
            <p className="py-8 text-center text-sm text-ink-soft">Carregando mesas...</p>
          ) : openTables.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">
              Nenhuma mesa aberta no momento.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {openTables.map((table) => (
                <li
                  key={table.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-surface p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Mesa {table.table_number}{" "}
                      <span className="font-normal text-ink-soft">#{table.order_number}</span>
                    </p>
                    <p className="text-xs text-ink-soft">{formatCurrency(table.subtotal)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openDetails(table)}>
                      Itens
                    </Button>
                    <Button type="button" size="sm" onClick={() => goToClose(table)}>
                      Fechar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (view === "details" && activeTable) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 bg-ink px-4 py-3">
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Mesa {activeTable.table_number} — itens
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoadingItems ? (
            <p className="py-8 text-center text-sm text-ink-soft">Carregando itens...</p>
          ) : tableItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">Nenhum item lançado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tableItems.map((item) => (
                <li key={item.id} className="rounded-xl bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {item.sale_type === "weight" ? `${item.weight_grams} g` : `${item.quantity}x`}{" "}
                        {item.product_name}
                      </p>
                      {(tableItemModifiers[item.id] ?? []).length > 0 && (
                        <p className="text-xs text-ink-soft">
                          {tableItemModifiers[item.id]
                            .map((m) => `${m.quantity}x ${m.name}`)
                            .join(", ")}
                        </p>
                      )}
                      {item.notes && <p className="text-xs italic text-ink-soft">{item.notes}</p>}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-ink">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={removingItemId === item.id}
                      onClick={() => handleRemoveItem(item.id, item.product_name)}
                      className="text-xs font-semibold text-brand"
                    >
                      Cancelar item
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="mt-3 text-sm text-brand" role="alert">
              {error}
            </p>
          )}

          <a
            href={`/imprimir/${activeTable.id}?tipo=comanda`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block"
          >
            <Button type="button" variant="outline" className="w-full">
              Imprimir comanda
            </Button>
          </a>

          <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setView("list")}>
            Voltar para as mesas
          </Button>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 bg-ink px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Subtotal</p>
            <p className="font-display text-2xl text-white">{formatCurrency(activeTable.subtotal)}</p>
          </div>
          <div className="flex flex-1 gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => resumeTable(activeTable)}>
              + Itens
            </Button>
            <Button type="button" className="flex-1" onClick={() => goToClose(activeTable)}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "closing" && activeTable) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 bg-ink px-4 py-3">
          <h2 className="font-display text-lg uppercase tracking-wide text-white">
            Fechar mesa {activeTable.table_number}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-ink">
              <span className="text-ink-soft">Subtotal</span>
              <span>{formatCurrency(activeTable.subtotal)}</span>
            </div>

            <Input
              label="Desconto (R$, opcional)"
              type="number"
              step="0.01"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />

            <Textarea
              label="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

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

            <Button type="button" variant="ghost" onClick={() => setView("list")}>
              Voltar
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 bg-ink px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Total</p>
            <p className="font-display text-2xl text-white">{formatCurrency(closeTotal)}</p>
          </div>
          <Button
            type="button"
            isLoading={isSubmitting}
            onClick={handleCloseTable}
            size="lg"
            className="flex-1"
          >
            Fechar mesa e cobrar
          </Button>
        </div>
      </div>
    );
  }

  // view === "building"
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 bg-ink px-4 py-3">
        <h2 className="font-display text-lg uppercase tracking-wide text-white">
          {activeTable ? `Mesa ${activeTable.table_number} — novos itens` : `Nova mesa ${newTableNumber}`}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-ink p-4">
        <CartItemsList emptyLabel="Adicione os itens desta rodada." />
      </div>

      <div className="flex flex-col gap-2 border-t border-ink/10 p-4">
        {error && (
          <p className="text-sm text-brand" role="alert">
            {error}
          </p>
        )}
        <Button type="button" variant="ghost" onClick={() => setView("list")}>
          Voltar para as mesas
        </Button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 bg-ink px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Subtotal da rodada</p>
          <p className="font-display text-2xl text-white">{formatCurrency(subtotal)}</p>
        </div>
        <Button
          type="button"
          isLoading={isSubmitting}
          disabled={items.length === 0}
          onClick={handleSendToKitchen}
          size="lg"
          className="flex-1"
        >
          {activeTable ? "Enviar mais itens" : "Enviar para a cozinha"}
        </Button>
      </div>
    </div>
  );
}
