import type { Database } from "./database.types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductSize = Database["public"]["Tables"]["product_sizes"]["Row"];
export type Neighborhood = Database["public"]["Tables"]["neighborhoods"]["Row"];
export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

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
}

export type PaymentMethod = "dinheiro" | "pix" | "cartao";

export interface CheckoutFormData {
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
