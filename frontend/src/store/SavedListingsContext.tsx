import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchSavedListingIds,
  saveListing,
  unsaveListing,
} from "../lib/api";
import { useAuth } from "./AuthContext";
import { useConfirm } from "./ConfirmContext";

/** Only the ids are stored — the listing itself is looked up from the API. */
type SavedListingsValue = {
  ids: string[];
  count: number;
  isSaved: (id: string) => boolean;
  /** Saves or unsaves. Prompts login when signed out; nothing is stored. */
  toggle: (id: string) => void;
  remove: (id: string) => void;
};

const SavedListingsContext = createContext<SavedListingsValue | null>(null);

/**
 * Listings the signed-in user has saved (the wishlist).
 *
 * The database is the source of truth: the ids are fetched when a user logs in
 * and re-fetched whenever the account changes, which is what makes a wishlist
 * saved in one browser appear when the same account logs in anywhere else. Local
 * state is only a cache for instant heart toggles.
 *
 * Nothing is saved for a logged-out visitor. There is no anonymous wishlist in
 * localStorage — a save attempt while signed out opens the login prompt instead,
 * so no saved data is ever created without an account behind it.
 */
export function SavedListingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();

  /** A Set for O(1) lookup. Empty whenever no one is signed in. */
  const [ids, setIds] = useState<Set<string>>(new Set());

  /* Load this user's saved ids on login, and clear them on logout so the next
     visitor never inherits the last one's wishlist. Keyed on the user id, so
     switching accounts refetches rather than showing the previous account's. */
  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }

    let live = true;
    fetchSavedListingIds()
      .then((list) => {
        if (live) setIds(new Set(list));
      })
      .catch(() => {
        // A failed load leaves the wishlist empty rather than crashing the app;
        // the next toggle will surface any real problem.
        if (live) setIds(new Set());
      });

    return () => {
      live = false;
    };
  }, [user]);

  /** Opens the login prompt. Returns nothing — the caller just stops. */
  const promptLogin = useCallback(async () => {
    const ok = await confirm({
      title: "Log in to save listings",
      message:
        "Saving keeps listings to your account so you can find them on any device. It only takes a moment.",
      confirmLabel: "Log in",
      cancelLabel: "Not now",
    });
    if (ok) navigate("/login");
  }, [confirm, navigate]);

  const toggle = useCallback(
    (id: string) => {
      if (!user) {
        void promptLogin();
        return;
      }

      const wasSaved = ids.has(id);

      // Optimistic: flip the heart now, reconcile with the server, and roll back
      // if the request fails so the UI never claims a save that did not happen.
      setIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });

      const request = wasSaved ? unsaveListing(id) : saveListing(id);
      request.catch(() => {
        setIds((current) => {
          const next = new Set(current);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
      });
    },
    [user, ids, promptLogin],
  );

  const remove = useCallback(
    (id: string) => {
      if (!user || !ids.has(id)) return;

      setIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      unsaveListing(id).catch(() => {
        setIds((current) => new Set(current).add(id));
      });
    },
    [user, ids],
  );

  const value = useMemo<SavedListingsValue>(
    () => ({
      ids: [...ids],
      count: ids.size,
      isSaved: (id) => ids.has(id),
      toggle,
      remove,
    }),
    [ids, toggle, remove],
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
