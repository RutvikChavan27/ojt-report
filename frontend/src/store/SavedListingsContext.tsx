import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../lib/storage";

/** Only the ids are stored — the listing itself is looked up from the data. */
type SavedListingsValue = {
  ids: string[];
  count: number;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
};

const SavedListingsContext = createContext<SavedListingsValue | null>(null);

/**
 * Listings a visitor has saved for later.
 *
 * Ids rather than whole listings: a saved copy would go stale the moment the
 * seller edited the price, and showing a stale price is worse than a lookup.
 */
export function SavedListingsProvider({ children }: { children: ReactNode }) {
  /** A Set for O(1) lookup, persisted as an array — a Set serialises to `{}`. */
  const [ids, setIds] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(STORAGE_KEYS.savedListings, [])),
  );

  useEffect(() => {
    saveJSON(STORAGE_KEYS.savedListings, [...ids]);
  }, [ids]);

  const value = useMemo<SavedListingsValue>(
    () => ({
      ids: [...ids],
      count: ids.size,
      isSaved: (id) => ids.has(id),
      toggle: (id) =>
        setIds((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      remove: (id) =>
        setIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        }),
    }),
    [ids],
  );

  return (
    <SavedListingsContext.Provider value={value}>
      {children}
    </SavedListingsContext.Provider>
  );
}

export function useSavedListings(): SavedListingsValue {
  const context = useContext(SavedListingsContext);
  if (!context) {
    throw new Error(
      "useSavedListings must be used within a SavedListingsProvider",
    );
  }
  return context;
}
