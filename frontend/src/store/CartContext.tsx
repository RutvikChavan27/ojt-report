import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * A line in the bag. The same garment in two sizes is two lines, so `id`
 * combines the product and the size rather than being the product id alone.
 */
export type CartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  /** Pre-discount price, when the item has one. Absent on second-hand listings. */
  originalPrice?: number;
  size?: string | null;
  category?: string;
  /**
   * Storefront products are priced in dollars and marketplace listings in
   * rupees, so each line carries its own symbol and the summary groups by it.
   */
  currency: string;
  quantity: number;
};

/** What callers pass to `add` — id and quantity are derived. */
export type CartInput = Omit<CartItem, "id" | "quantity"> & { quantity?: number };

export type CurrencyTotal = {
  currency: string;
  /** Sum of pre-discount prices, so that mrp − savings === payable. */
  mrp: number;
  /** What is actually owed. */
  payable: number;
  savings: number;
  itemCount: number;
};

type CartContextValue = {
  items: CartItem[];
  /** Total units in the bag, which is what the navbar badge shows. */
  count: number;
  /** One entry per currency present in the bag. */
  totals: CurrencyTotal[];
  add: (input: CartInput) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const lineId = (productId: string, size?: string | null) =>
  `${productId}::${size ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  /** Adds a line, or bumps the quantity when that product/size is already in. */
  const add = (input: CartInput) => {
    const id = lineId(input.productId, input.size);
    const quantity = Math.max(1, input.quantity ?? 1);

    setItems((current) => {
      const existing = current.find((item) => item.id === id);
      if (existing) {
        return current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...current, { ...input, id, quantity }];
    });
  };

  const remove = (id: string) =>
    setItems((current) => current.filter((item) => item.id !== id));

  /** Setting a quantity of zero or less removes the line. */
  const setQuantity = (id: string, quantity: number) =>
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );

  const clear = () => setItems([]);

  const value = useMemo<CartContextValue>(() => {
    const byCurrency = new Map<string, CurrencyTotal>();

    for (const item of items) {
      const running = byCurrency.get(item.currency) ?? {
        currency: item.currency,
        mrp: 0,
        payable: 0,
        savings: 0,
        itemCount: 0,
      };

      // An item without an originalPrice contributes its price to both sides,
      // so it adds nothing to savings and the arithmetic still balances.
      const unitMrp =
        item.originalPrice && item.originalPrice > item.price
          ? item.originalPrice
          : item.price;

      running.mrp += unitMrp * item.quantity;
      running.payable += item.price * item.quantity;
      running.savings += (unitMrp - item.price) * item.quantity;
      running.itemCount += item.quantity;
      byCurrency.set(item.currency, running);
    }

    return {
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      totals: [...byCurrency.values()],
      add,
      remove,
      setQuantity,
      clear,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** `const { items, count, totals, add, remove } = useCart();` */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
