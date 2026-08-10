import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../lib/api";

type WishlistContextValue = {
  items: Product[];
  count: number;
  isWishlisted: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Map<string, Product>>(new Map());

  const toggle = (product: Product) => {
    setItems((current) => {
      const next = new Map(current);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, product);
      }
      return next;
    });
  };

  const remove = (id: string) => {
    setItems((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  };

  const value = useMemo<WishlistContextValue>(
    () => ({
      items: [...items.values()],
      count: items.size,
      isWishlisted: (id) => items.has(id),
      toggle,
      remove,
    }),
    [items],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

/** Access the shared wishlist: `const { items, count, isWishlisted, toggle, remove } = useWishlist();` */
export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
