import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../lib/storage";
import { searchListings, paramsFromSearch } from "../lib/search";

export type SavedSearch = {
  id: string;
  /** The name the user chose, e.g. "iPhone under ₹50,000 in Pune". */
  name: string;
  /** The search as a query string, so it restores exactly. */
  query: string;
  createdAt: string;
  lastCheckedAt: string;
  /** How many results there were when it was last checked. */
  seenCount: number;
};

type SavedSearchesValue = {
  searches: SavedSearch[];
  save: (name: string, query: string) => void;
  remove: (id: string) => void;
  /** New matches since last checked — the "3 new listings" badge. */
  newCount: (search: SavedSearch) => number;
  /** Resets the badge; called when the saved search is opened. */
  markChecked: (id: string) => void;
};

const SavedSearchesContext = createContext<SavedSearchesValue | null>(null);

/**
 * Searches a user has saved, with a count of what has appeared since.
 *
 * The search is stored as its query string rather than as a parsed object. The
 * URL is already the canonical form of a search, so storing anything else would
 * be a second format to keep in step with it.
 */
export function SavedSearchesProvider({ children }: { children: ReactNode }) {
  const [searches, setSearches] = useState<SavedSearch[]>(() =>
    loadJSON<SavedSearch[]>(STORAGE_KEYS.savedSearches, []),
  );

  useEffect(() => {
    saveJSON(STORAGE_KEYS.savedSearches, searches);
  }, [searches]);

  const value = useMemo<SavedSearchesValue>(() => {
    /** Runs a saved search now, to compare against what was seen before. */
    const currentTotal = (search: SavedSearch) =>
      searchListings(paramsFromSearch(new URLSearchParams(search.query))).total;

    return {
      searches,

      save: (name, query) =>
        setSearches((current) => {
          const now = new Date().toISOString();
          const total = searchListings(
            paramsFromSearch(new URLSearchParams(query)),
          ).total;

          return [
            {
              id: `s-${Date.now().toString(36)}`,
              name,
              query,
              createdAt: now,
              lastCheckedAt: now,
              // Baseline is what exists now, so the badge starts at zero
              // instead of announcing everything as new.
              seenCount: total,
            },
            ...current,
          ];
        }),

      remove: (id) =>
        setSearches((current) => current.filter((entry) => entry.id !== id)),

      // Clamped at zero: listings expire and get sold, so the total can fall
      // below the baseline, and "-2 new listings" is not a thing.
      newCount: (search) => Math.max(0, currentTotal(search) - search.seenCount),

      markChecked: (id) =>
        setSearches((current) =>
          current.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  lastCheckedAt: new Date().toISOString(),
                  seenCount: currentTotal(entry),
                }
              : entry,
          ),
        ),
    };
  }, [searches]);

  return (
    <SavedSearchesContext.Provider value={value}>
      {children}
    </SavedSearchesContext.Provider>
  );
}

export function useSavedSearches(): SavedSearchesValue {
  const context = useContext(SavedSearchesContext);
  if (!context) {
    throw new Error(
      "useSavedSearches must be used within a SavedSearchesProvider",
    );
  }
  return context;
}
