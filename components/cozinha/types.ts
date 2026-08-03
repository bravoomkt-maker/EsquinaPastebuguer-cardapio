export interface KitchenOrderItem {
  id: string;
  productName: string;
  quantity: number;
  saleType: "unit" | "weight";
  weightGrams: number | null;
  notes: string | null;
  modifiers: { name: string; quantity: number }[];
}

export interface KitchenOrder {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  customerName: string;
  notes: string | null;
  status: "pending" | "confirmed" | "preparing" | "ready";
  pickupAt: string | null;
  createdAt: string;
  items: KitchenOrderItem[];
}
