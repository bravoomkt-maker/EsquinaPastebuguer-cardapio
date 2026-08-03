// Cálculo de troco para pagamentos em dinheiro. Espelha a validação feita no
// servidor (create_pos_order): não permite valor recebido menor que o valor
// a pagar, exceto quando o pagamento é dividido (nesse caso "amount" já é a
// fração atribuída àquela forma de pagamento, não o total do pedido).

export function calculateChange(receivedAmount: number, amountDue: number): number {
  if (receivedAmount < amountDue) return 0;
  return Math.round((receivedAmount - amountDue) * 100) / 100;
}

export function isSufficientCashPayment(receivedAmount: number, amountDue: number): boolean {
  return receivedAmount >= amountDue;
}
