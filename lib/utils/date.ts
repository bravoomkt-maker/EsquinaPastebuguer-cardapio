export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
