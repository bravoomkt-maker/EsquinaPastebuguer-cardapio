import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

export interface AddCartItemInput {
  productId: string;
  name: string;
  unitPrice: number;
  quantity?: number;
  imageUrl: string | null;
  sizeLabel?: string | null;
  secondProductId?: string | null;
  minQuantity?: number;
  categoryName: string;
}

function buildLineId(input: {
  productId: string;
  sizeLabel?: string | null;
  secondProductId?: string | null;
}): string {
  return [input.productId, input.sizeLabel ?? "", input.secondProductId ?? ""].join(
    ":"
  );
}

interface CartState {
  items: CartItem[];
  addItem: (input: AddCartItemInput) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  setNotes: (lineId: string, notes: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (input) =>
        set((state) => {
          const minQuantity = input.minQuantity ?? 1;
          const quantity = input.quantity ?? minQuantity;
          const lineId = buildLineId(input);
          const existing = state.items.find((item) => item.lineId === lineId);

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.lineId === lineId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                lineId,
                productId: input.productId,
                name: input.name,
                unitPrice: input.unitPrice,
                quantity,
                notes: "",
                imageUrl: input.imageUrl,
                sizeLabel: input.sizeLabel ?? null,
                secondProductId: input.secondProductId ?? null,
                minQuantity,
                categoryName: input.categoryName,
              },
            ],
          };
        }),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        })),

      setQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.lineId !== lineId)
              : state.items.map((item) =>
                  item.lineId === lineId
                    ? { ...item, quantity: Math.max(quantity, item.minQuantity) }
                    : item
                ),
        })),

      setNotes: (lineId, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? { ...item, notes } : item
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "esquina-pasteburguer-cart" }
  )
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
