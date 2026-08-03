export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// America/Fortaleza não tem horário de verão (fixo UTC-3), então o offset
// pode ser tratado como constante em vez de depender de biblioteca de fuso.
const FORTALEZA_OFFSET = "-03:00";

export type ReportPeriod = "hoje" | "ontem" | "7d" | "mes" | "personalizado";

export function todayInFortaleza(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Fortaleza" });
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function firstDayOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

export function fortalezaDateRangeToUtc(
  fromDateStr: string,
  toDateStr: string
): { startUtc: string; endUtc: string } {
  return {
    startUtc: new Date(`${fromDateStr}T00:00:00${FORTALEZA_OFFSET}`).toISOString(),
    endUtc: new Date(`${toDateStr}T23:59:59.999${FORTALEZA_OFFSET}`).toISOString(),
  };
}

export function resolveReportPeriod(
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string
): { from: string; to: string; startUtc: string; endUtc: string } {
  const today = todayInFortaleza();
  let from = today;
  let to = today;

  switch (period) {
    case "ontem":
      from = addDays(today, -1);
      to = from;
      break;
    case "7d":
      from = addDays(today, -6);
      to = today;
      break;
    case "mes":
      from = firstDayOfMonth(today);
      to = today;
      break;
    case "personalizado":
      from = customFrom || today;
      to = customTo || today;
      break;
    default:
      from = today;
      to = today;
  }

  const { startUtc, endUtc } = fortalezaDateRangeToUtc(from, to);
  return { from, to, startUtc, endUtc };
}

export function hourInFortaleza(isoDate: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Fortaleza",
      hour: "numeric",
      hour12: false,
    }).format(new Date(isoDate))
  );
}
