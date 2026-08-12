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

type AuthContextValue = {
  user: AuthUser | null;
  /** True until the first /me call settles, so the navbar can avoid flickering. */
  loading: boolean;
  /** Whether the server has Google credentials configured. */
  googleEnabled: boolean;
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
    if (!params.has("auth")) return;

    void refresh();
    params.delete("auth");
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
      // Errors propagate so the form can show the server's message.
      signIn: async (input) => setUser(await loginUser(input)),
      signUp: async (input) => setUser(await registerUser(input)),
      signOut: async () => {
        await logoutUser();
        setUser(null);
      },
    }),
    [user, loading, googleEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** `const { user, signIn, signOut } = useAuth();` */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
