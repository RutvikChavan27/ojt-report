import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadJSON, saveJSON, STORAGE_KEYS } from "../lib/storage";
import { paramsFromSearch } from "../lib/search";
import { searchListingsViaApi } from "../lib/searchApi";

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
  save: (name: string, query: string) => Promise<void>;
  remove: (id: string) => void;
  /** New matches since last checked — the "3 new listings" badge. */
  newCount: (search: SavedSearch) => number;
  /** Resets the badge; called when the saved search is opened. */
  markChecked: (id: string) => Promise<void>;
};

const SavedSearchesContext = createContext<SavedSearchesValue | null>(null);

/**
 * How many results a saved search returns right now, from the server.
 *
 * Goes through the same bridge the results page uses rather than a bespoke count
 * query, so "new matches" is counted by exactly the rules that decide what the
 * page will show. A count derived differently from the listing it points at is
 * the kind of subtly wrong number that is worse than no number at all.
 *
 * @returns the total, or null when the request fails — null means "unknown",
 *          which the badge treats as nothing new rather than inventing a count.
 */
async function currentTotal(query: string): Promise<number | null> {
  try {
    const result = await searchListingsViaApi(
      paramsFromSearch(new URLSearchParams(query)),
    );
    return result.total;
  } catch {
    return null;
  }
}

/**
 * Searches a user has saved, with a count of what has appeared since.
 *
 * The search is stored as its query string rather than as a parsed object. The
 * URL is already the canonical form of a search, so storing anything else would
 * be a second format to keep in step with it.
 *
 * Totals live in a cache refreshed from the server, which keeps `newCount`
 * synchronous for callers that render a badge inline. The alternative — awaiting
 * a request inside render — is not something a component can do.
 */
export function SavedSearchesProvider({ children }: { children: ReactNode }) {
  const [searches, setSearches] = useState<SavedSearch[]>(() =>
    loadJSON<SavedSearch[]>(STORAGE_KEYS.savedSearches, []),
  );

  /** Live totals by saved-search id, as last fetched. */
  const [totals, setTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    saveJSON(STORAGE_KEYS.savedSearches, searches);
  }, [searches]);

  /* Refresh every saved search's total when the set of them changes. Keyed on
     the ids and queries rather than the array identity, so re-saving the same
     list (which happens whenever a badge is cleared) does not refetch. */
  const fingerprint = searches.map((entry) => `${entry.id}:${entry.query}`).join("|");

  useEffect(() => {
    let live = true;
    if (searches.length === 0) return;

    void Promise.all(
      searches.map(async (entry) => [entry.id, await currentTotal(entry.query)] as const),
    ).then((pairs) => {
      if (!live) return;
      setTotals((current) => {
        const next = { ...current };
        for (const [id, total] of pairs) if (total !== null) next[id] = total;
        return next;
      });
    });

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  const save = useCallback(async (name: string, query: string) => {
    // Baseline is what exists now, so the badge starts at zero instead of
    // announcing every existing listing as new.
    const total = await currentTotal(query);
    const now = new Date().toISOString();
    const id = `s-${Date.now().toString(36)}`;

    setSearches((current) => [
      {
        id,
        name,
        query,
        createdAt: now,
        lastCheckedAt: now,
        seenCount: total ?? 0,
      },
      ...current,
    ]);
    if (total !== null) setTotals((current) => ({ ...current, [id]: total }));
  }, []);

  const remove = useCallback((id: string) => {
    setSearches((current) => current.filter((entry) => entry.id !== id));
    setTotals((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const markChecked = useCallback(async (id: string) => {
    setSearches((current) => {
      const entry = current.find((item) => item.id === id);
      if (!entry) return current;
      return current.map((item) =>
        item.id === id
          ? {
              ...item,
              lastCheckedAt: new Date().toISOString(),
              // Rebaseline to the last known total; the effect above keeps it
              // current, so this is the number the badge was just showing.
              seenCount: totals[id] ?? item.seenCount,
            }
          : item,
      );
    });
  }, [totals]);

  const value = useMemo<SavedSearchesValue>(
    () => ({
      searches,
      save,
      remove,
      markChecked,
      // Clamped at zero: listings expire and get sold, so the total can fall
      // below the baseline, and "-2 new listings" is not a thing.
      newCount: (search) =>
        Math.max(0, (totals[search.id] ?? search.seenCount) - search.seenCount),
    }),
    [searches, save, remove, markChecked, totals],
  );

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
