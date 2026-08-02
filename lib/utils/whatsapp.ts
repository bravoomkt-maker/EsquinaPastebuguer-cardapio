import type { CartItem, CheckoutFormData, Neighborhood } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";

const PAYMENT_LABELS: Record<CheckoutFormData["paymentMethod"], string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

export function buildOrderMessage({
  form,
  items,
  neighborhood,
  subtotal,
  deliveryFee,
  total,
}: {
  form: CheckoutFormData;
  items: CartItem[];
  neighborhood: Neighborhood;
  subtotal: number;
  deliveryFee: number;
  total: number;
}): string {
  const lines: string[] = [];

  lines.push("*Novo pedido - Esquina Pasteburguer*");
  lines.push("");
  lines.push("*Itens:*");

  const itemsByCategory = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.categoryName || "Outros";
    const group = itemsByCategory.get(key) ?? [];
    group.push(item);
    itemsByCategory.set(key, group);
  }

  for (const [categoryName, categoryItems] of itemsByCategory) {
    lines.push("");
    lines.push(`*${categoryName}:*`);
    for (const item of categoryItems) {
      lines.push(
        `• ${item.quantity}x ${item.name} - ${formatCurrency(
          item.unitPrice * item.quantity
        )}`
      );
      if (item.notes.trim()) {
        lines.push(`  obs: ${item.notes.trim()}`);
      }
    }
  }

  lines.push("");
  lines.push(`Subtotal: ${formatCurrency(subtotal)}`);
  lines.push(`Taxa de entrega (${neighborhood.name}): ${formatCurrency(deliveryFee)}`);
  lines.push(`*Total: ${formatCurrency(total)}*`);
  lines.push("");
  lines.push("*Dados para entrega:*");
  lines.push(`Nome: ${form.customerName}`);
  lines.push(`Telefone: ${form.customerPhone}`);

  const addressParts = [`${form.street}, ${form.number}`];
  if (form.complement.trim()) addressParts.push(form.complement.trim());
  lines.push(`Endereço: ${addressParts.join(" - ")}`);
  lines.push(`Bairro: ${neighborhood.name}`);
  if (form.referencePoint.trim()) {
    lines.push(`Ponto de referência: ${form.referencePoint.trim()}`);
  }

  lines.push("");
  lines.push(`Pagamento: ${PAYMENT_LABELS[form.paymentMethod]}`);
  if (form.paymentMethod === "dinheiro" && form.changeFor.trim()) {
    lines.push(`Troco para: ${form.changeFor.trim()}`);
  }

  if (form.notes.trim()) {
    lines.push("");
    lines.push(`Observação: ${form.notes.trim()}`);
  }

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
