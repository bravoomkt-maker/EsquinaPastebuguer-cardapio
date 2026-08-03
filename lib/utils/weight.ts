// Cálculo do valor de itens vendidos por peso (ex: açaí).
// Fórmula: valor = peso em gramas × preço por kg ÷ 1000, arredondado em centavos.
// Espelha exatamente a lógica usada em SQL na função create_pos_order
// (supabase/migrations/0023_create_pos_order.sql) - mantenha as duas em sincronia.

export function computeWeightValue(weightGrams: number, pricePerKg: number): number {
  if (weightGrams <= 0 || pricePerKg < 0) return 0;
  return Math.round(((weightGrams * pricePerKg) / 1000) * 100) / 100;
}

export function isValidWeight(weightGrams: number, maxWeightGrams: number): boolean {
  return Number.isInteger(weightGrams) && weightGrams > 0 && weightGrams <= maxWeightGrams;
}
