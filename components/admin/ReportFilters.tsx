"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ReportPeriod } from "@/lib/utils/date";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7d": "Últimos 7 dias",
  mes: "Mês atual",
  personalizado: "Período personalizado",
};

export function ReportFilters({
  period,
  from,
  to,
}: {
  period: ReportPeriod;
  from: string;
  to: string;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(period);

  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <Select
        label="Período"
        name="periodo"
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
      >
        {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((p) => (
          <option key={p} value={p}>
            {PERIOD_LABELS[p]}
          </option>
        ))}
      </Select>

      {selectedPeriod === "personalizado" && (
        <>
          <Input label="De" type="date" name="de" defaultValue={from} />
          <Input label="Até" type="date" name="ate" defaultValue={to} />
        </>
      )}

      <Button type="submit">Filtrar</Button>
    </form>
  );
}
