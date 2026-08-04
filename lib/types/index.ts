import type { Database } from "./database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductSize = Database["public"]["Tables"]["product_sizes"]["Row"];
export type Neighborhood = Database["public"]["Tables"]["neighborhoods"]["Row"];
export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

// --- PDV: papéis, status e tipos de pedido ---

export type StaffRole = "admin" | "caixa" | "cozinha";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Novo",
  confirmed: "Confirmado",
  preparing: "Em preparação",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Finalizado",
  cancelled: "Cancelado",
};

export type OrderType = "balcao" | "mesa" | "retirada" | "entrega";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  balcao: "Balcão",
  mesa: "Consumo no local",
  retirada: "Retirada",
  entrega: "Entrega",
};

export type PricingType = "unit" | "weight";
export type OrderSource = "cardapio" | "pdv";

// --- PDV: adicionais, clientes, pagamentos, caixa ---

export type ModifierGroup = Database["public"]["Tables"]["modifier_groups"]["Row"];
export type Modifier = Database["public"]["Tables"]["modifiers"]["Row"];
export type ProductModifierGroup =
  Database["public"]["Tables"]["product_modifier_groups"]["Row"];
export type OrderItemModifier = Database["public"]["Tables"]["order_item_modifiers"]["Row"];
export type OrderStatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export type PaymentMethodRow = Database["public"]["Tables"]["payment_methods"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

export type CashRegister = Database["public"]["Tables"]["cash_registers"]["Row"];
export type CashMovementType =
  | "venda"
  | "entrada"
  | "suprimento"
  | "saida"
  | "sangria"
  | "estorno"
  | "cancelamento";
export type CashMovement = Database["public"]["Tables"]["cash_movements"]["Row"];

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  venda: "Venda",
  entrada: "Entrada",
  suprimento: "Suprimento",
  saida: "Saída",
  sangria: "Sangria",
  estorno: "Estorno",
  cancelamento: "Cancelamento",
};

export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
export type PrinterSettings = Database["public"]["Tables"]["printer_settings"]["Row"];

export interface ProductWithModifierGroups extends Product {
  modifierGroups: (ModifierGroup & { modifiers: Modifier[] })[];
}

export interface ProductWithSizes extends Product {
  sizes: ProductSize[];
}

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  imageUrl: string | null;
  sizeLabel: string | null;
  secondProductId: string | null;
  minQuantity: number;
  categoryName: string;
}

export type PaymentMethod = "dinheiro" | "pix" | "cartao";
export type CheckoutOrderType = "entrega" | "retirada";

export interface CheckoutFormData {
  orderType: CheckoutOrderType;
  customerName: string;
  customerPhone: string;
  street: string;
  number: string;
  complement: string;
  referencePoint: string;
  neighborhoodId: string;
  paymentMethod: PaymentMethod;
  changeFor: string;
  notes: string;
}
