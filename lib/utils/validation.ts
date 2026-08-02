import type { CheckoutFormData } from "@/lib/types";

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormData, string>>;

export function validateCheckoutForm(
  form: CheckoutFormData
): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};

  if (!form.customerName.trim()) errors.customerName = "Informe seu nome";
  if (!form.customerPhone.trim()) errors.customerPhone = "Informe seu telefone";
  if (!form.street.trim()) errors.street = "Informe a rua";
  if (!form.number.trim()) errors.number = "Informe o número";
  if (!form.neighborhoodId) errors.neighborhoodId = "Selecione o bairro";
  if (!form.paymentMethod) errors.paymentMethod = "Selecione a forma de pagamento";

  if (form.paymentMethod === "dinheiro" && form.changeFor.trim()) {
    const changeValue = Number(form.changeFor.replace(",", "."));
    if (Number.isNaN(changeValue) || changeValue < 0) {
      errors.changeFor = "Valor de troco inválido";
    }
  }

  return errors;
}
