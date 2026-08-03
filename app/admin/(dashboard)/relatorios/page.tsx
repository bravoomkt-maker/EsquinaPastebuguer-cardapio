import { ReportFilters } from "@/components/admin/ReportFilters";
import { Badge } from "@/components/ui/Badge";
import { buildReport, type ReportPayment } from "@/lib/reports/aggregate";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { resolveReportPeriod, type ReportPeriod } from "@/lib/utils/date";
import type { Order, OrderItem } from "@/lib/types";

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (currentProfile?.role !== "admin") {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-ink/10">
        Acesso restrito a administradores.
      </div>
    );
  }

  const params = await searchParams;
  const period = (params.periodo as ReportPeriod) || "hoje";
  const { from, to, startUtc, endUtc } = resolveReportPeriod(period, params.de, params.ate);

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", startUtc)
    .lte("created_at", endUtc);

  const orderIds = (orders ?? []).map((o) => o.id);

  const [{ data: items }, { data: paymentsRaw }, { data: profiles }] = await Promise.all([
    orderIds.length
      ? supabase.from("order_items").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [] as OrderItem[] }),
    orderIds.length
      ? supabase
          .from("payments")
          .select("order_id, amount, payment_methods(name)")
          .in("order_id", orderIds)
      : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const profileNameById: Record<string, string> = {};
  for (const p of profiles ?? []) {
    profileNameById[p.id] = p.full_name ?? "Sem nome";
  }

  const payments: ReportPayment[] = (paymentsRaw ?? []).map((p) => ({
    order_id: p.order_id,
    amount: p.amount,
    payment_method_name:
      (p as unknown as { payment_methods: { name: string } | null }).payment_methods?.name ??
      "Outro",
  }));

  const report = buildReport({
    orders: (orders ?? []) as Order[],
    items: (items ?? []) as OrderItem[],
    payments,
    profileNameById,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">Relatórios</h1>

      <ReportFilters period={period} from={from} to={to} />
      <p className="text-xs text-ink-soft">
        Período: {from === to ? from : `${from} a ${to}`}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Faturamento" value={formatCurrency(report.revenue)} />
        <Card label="Pedidos" value={String(report.orderCount)} />
        <Card label="Ticket médio" value={formatCurrency(report.averageTicket)} />
        <Card label="Cancelados" value={String(report.cancelledCount)} />
        <Card label="Descontos concedidos" value={formatCurrency(report.discountsTotal)} />
        <Card label="Taxas de entrega recebidas" value={formatCurrency(report.deliveryFeesTotal)} />
        <Card label="Peso de açaí vendido" value={`${(report.weightSoldGrams / 1000).toFixed(3)} kg`} />
        <Card label="Faturamento de itens por peso" value={formatCurrency(report.weightRevenue)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Vendas por tipo de pedido</p>
          {report.salesByOrderType.length === 0 ? (
            <p className="text-sm text-ink-soft">Sem dados no período.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.salesByOrderType.map((row) => (
                <li key={row.type} className="flex justify-between">
                  <span className="text-ink-soft">
                    {row.label} ({row.count})
                  </span>
                  <span className="font-semibold text-ink">{formatCurrency(row.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Vendas por forma de pagamento</p>
          {report.salesByPaymentMethod.length === 0 ? (
            <p className="text-sm text-ink-soft">Sem dados no período.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.salesByPaymentMethod.map((row) => (
                <li key={row.name} className="flex justify-between">
                  <span className="text-ink-soft">{row.name}</span>
                  <span className="font-semibold text-ink">{formatCurrency(row.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Produtos mais vendidos</p>
          {report.topProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">Sem dados no período.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.topProducts.map((row) => (
                <li key={row.name} className="flex justify-between">
                  <span className="text-ink-soft">{row.name}</span>
                  <span className="font-semibold text-ink">{formatCurrency(row.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Produtos menos vendidos</p>
          {report.bottomProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">Sem dados no período.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.bottomProducts.map((row) => (
                <li key={row.name} className="flex justify-between">
                  <span className="text-ink-soft">{row.name}</span>
                  <span className="font-semibold text-ink">{formatCurrency(row.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Horários com mais pedidos</p>
          {report.ordersByHour.length === 0 ? (
            <p className="text-sm text-ink-soft">Sem dados no período.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {report.ordersByHour.slice(0, 8).map((row) => (
                <Badge key={row.hour} tone="muted">
                  {String(row.hour).padStart(2, "0")}h — {row.count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className="mb-2 text-sm font-semibold text-ink">Vendas por funcionário (PDV)</p>
          {report.salesByEmployee.length === 0 ? (
            <p className="text-sm text-ink-soft">Sem vendas de PDV no período.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {report.salesByEmployee.map((row) => (
                <li key={row.name} className="flex justify-between">
                  <span className="text-ink-soft">{row.name}</span>
                  <span className="font-semibold text-ink">{formatCurrency(row.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
