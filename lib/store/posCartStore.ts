import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeWeightValue } from "@/lib/utils/weight";

export interface PosCartModifier {
  modifierId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PosCartItem {
  lineId: string;
  productId: string;
  name: string;
  saleType: "unit" | "weight";
  quantity: number;
  weightGrams: number | null;
  pricePerKg: number | null;
  unitPrice: number;
  sizeLabel: string | null;
  secondProductId: string | null;
  notes: string;
  modifiers: PosCartModifier[];
  imageUrl: string | null;
  categoryName: string;
}

export type AddPosCartItemInput = Omit<PosCartItem, "lineId" | "quantity"> & {
  quantity?: number;
};

function buildLineId(
  input: Pick<
    PosCartItem,
    "productId" | "sizeLabel" | "secondProductId" | "weightGrams" | "modifiers"
  >
): string {
  const modifierKey = input.modifiers
    .map((m) => `${m.modifierId}x${m.quantity}`)
    .sort()
    .join(",");
  return [
    input.productId,
    input.sizeLabel ?? "",
    input.secondProductId ?? "",
    input.weightGrams ?? "",
    modifierKey,
  ].join(":");
}

// Adicionais não são multiplicados pela quantidade do produto (cobrados uma
// vez por linha) - por isso o stepper de quantidade fica bloqueado no
// carrinho para linhas com adicionais ou vendidas por peso; para pedir mais,
// o atendente adiciona uma nova linha.
export function posCartItemTotal(item: PosCartItem): number {
  const modifiersTotal = item.modifiers.reduce(
    (sum, m) => sum + m.price * m.quantity,
    0
  );

  if (item.saleType === "weight") {
    const base =
      item.weightGrams && item.pricePerKg
        ? computeWeightValue(item.weightGrams, item.pricePerKg)
        : 0;
    return base + modifiersTotal;
  }

  return item.unitPrice * item.quantity + modifiersTotal;
}

export function posCartSubtotal(items: PosCartItem[]): number {
  return items.reduce((sum, item) => sum + posCartItemTotal(item), 0);
}

interface PosCartState {
  items: PosCartItem[];
  addItem: (input: AddPosCartItemInput) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  setNotes: (lineId: string, notes: string) => void;
  clear: () => void;
}

export const usePosCartStore = create<PosCartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (input) =>
        set((state) => {
          const quantity = input.quantity ?? 1;
          const lineId = buildLineId(input);
          const canMerge = input.saleType === "unit" && input.modifiers.length === 0;

          if (canMerge) {
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
          }

          return {
            items: [...state.items, { ...input, lineId, quantity }],
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
                  item.lineId === lineId ? { ...item, quantity } : item
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
    { name: "esquina-pasteburguer-pos-cart" }
  )
);
