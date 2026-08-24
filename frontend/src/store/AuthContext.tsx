import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAuthProviders,
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
} from "../lib/api";

/**
 * One account system.
 *
 * There is deliberately no notion of a buyer or a seller here. Anyone signed in
 * may post a listing, and "seller" only ever describes the user a given listing
 * belongs to — a fact about that listing, not a property of the account.
 */
/** One of the `?auth=` reasons the Google callback redirect can carry. */
type AuthNoticeCode =
  | "google_ok"
  | "google_denied"
  | "google_state_mismatch"
  | "google_unconfigured"
  | "google_failed";

export type AuthNotice = {
  code: AuthNoticeCode;
  /** Google's own short error code (invalid_client, invalid_grant, ...) — only present alongside "google_failed". */
  detail?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the first /me call settles, so the navbar can avoid flickering. */
  loading: boolean;
  /** Whether the server has Google credentials configured. */
  googleEnabled: boolean;
  /**
   * The most recent Google sign-in outcome, so a failure is visible on
   * screen instead of only in a server log — previously the callback
   * redirect's `?auth=` marker was stripped from the URL before anyone
   * could read it.
   */
  authNotice: AuthNotice | null;
  dismissAuthNotice: () => void;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null);

  /**
   * Asks the server who is signed in. This is what makes the session survive a
   * refresh: the cookie is httpOnly, so the page cannot read it and has to ask.
   */
  const refresh = useCallback(async () => {
    try {
      setUser(await fetchCurrentUser());
    } catch {
      // A failed check means "not signed in" as far as the UI is concerned.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    fetchAuthProviders()
      .then((providers) => setGoogleEnabled(providers.google))
      .catch(() => setGoogleEnabled(false));
  }, [refresh]);

  /**
   * Clears the `?auth=` marker the Google callback appends, after re-checking
   * the session. Without this the flag stays in the address bar and would be
   * re-read on every later navigation.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (!auth) return;

    void refresh();
    // "google_ok" needs no banner — only a reason worth showing gets kept.
    if (auth !== "google_ok") {
      setAuthNotice({ code: auth as AuthNotice["code"], detail: params.get("reason") ?? undefined });
    }
    params.delete("auth");
    params.delete("reason");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      googleEnabled,
      authNotice,
      dismissAuthNotice: () => setAuthNotice(null),
      // Errors propagate so the form can show the server's message.
      signIn: async (input) => setUser(await loginUser(input)),
      signUp: async (input) => setUser(await registerUser(input)),
      signOut: async () => {
        await logoutUser();
        setUser(null);
      },
    }),
    [user, loading, googleEnabled, authNotice],
  );

  return (
    <AuthContext.Provider value={value}>
      {authNotice && <GoogleAuthNoticeBanner notice={authNotice} onDismiss={value.dismissAuthNotice} />}
      {children}
    </AuthContext.Provider>
  );
}

/** Plain-language text for each failure code — shown so a sign-in problem is visible without opening a server log. */
function describeAuthNotice(notice: AuthNotice): string {
  switch (notice.code) {
    case "google_denied":
      return "Google sign-in was cancelled.";
    case "google_state_mismatch":
      return "That sign-in link expired or was already used — please try again.";
    case "google_unconfigured":
      return "Google sign-in isn't set up on the server yet.";
    case "google_failed":
      return notice.detail
        ? `Google sign-in failed: ${notice.detail}`
        : "Google sign-in failed for an unknown reason.";
    default:
      return "Google sign-in did not complete.";
  }
}

/**
 * A dismissible banner for a failed Google sign-in — fixed to the top of the
 * viewport so it appears regardless of which page the callback redirect
 * lands on. Rendered inside the provider itself rather than in a page, since
 * that's the one place already reading the `?auth=` marker.
 */
function GoogleAuthNoticeBanner({
  notice,
  onDismiss,
}: {
  notice: AuthNotice;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-900 shadow-sm">
      <span>{describeAuthNotice(notice)}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full px-2 py-0.5 text-xs font-bold text-amber-900 underline decoration-amber-500 underline-offset-2 hover:bg-amber-200"
      >
        Dismiss
      </button>
    </div>
  );
}

/** `const { user, signIn, signOut } = useAuth();` */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
