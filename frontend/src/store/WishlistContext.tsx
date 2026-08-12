import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../lib/storage";

/**
 * Anything likeable: a real Product (has category/price) or a lookbook photo
 * (image + name only). category/price are optional so both shapes fit.
 */
export type WishlistItem = {
  id: string;
  name: string;
  image: string;
  category?: string;
  price?: number;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  isWishlisted: (id: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  /**
   * Held as a Map for O(1) `isWishlisted`, but stored as an array — a Map does
   * not survive JSON.stringify, it serialises to `{}`.
   */
  const [items, setItems] = useState<Map<string, WishlistItem>>(
    () =>
      new Map(
        loadJSON<WishlistItem[]>(STORAGE_KEYS.wishlist, []).map((item) => [
          item.id,
          item,
        ]),
      ),
  );

  useEffect(() => {
    saveJSON(STORAGE_KEYS.wishlist, [...items.values()]);
  }, [items]);

  const toggle = (item: WishlistItem) => {
    setItems((current) => {
      const next = new Map(current);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
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
