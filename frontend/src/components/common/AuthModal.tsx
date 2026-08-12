import { useState } from "react";
import { FiX, FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { googleSignInUrl } from "../../lib/api";
import { useAuth } from "../../store/AuthContext";

type AuthModalProps = {
  onClose: () => void;
};

type AuthMode = "sign-in" | "sign-up";

function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const { signIn, signUp, googleEnabled } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Switching tabs clears the error, which belonged to the other form. */
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signIn({ email, password });
      } else {
        await signUp({ name, email, password });
      }
      onClose();
    } catch (err) {
      // The server's wording is the user-facing message.
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md animate-[modal-in_0.25s_ease-out] overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="relative bg-gray-900 px-7 pb-8 pt-7 text-white">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <FiX size={16} />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-900">
            <FiUser size={20} />
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight">
            {mode === "sign-in" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            {mode === "sign-in"
              ? "Sign in to track orders and saved items."
              : "Sign up to start your first order."}
          </p>
        </div>

        <div className="px-7 pb-7 pt-6">
          {/* Tabs */}
          <div className="flex rounded-full bg-gray-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className={`flex-1 rounded-full py-2 transition ${
                mode === "sign-in"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("sign-up")}
              className={`flex-1 rounded-full py-2 transition ${
                mode === "sign-up"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <div className="relative mt-5">
                <FiUser
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            )}

            <div className="relative mt-4">
              <FiMail
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div className="relative mt-4">
              <FiLock
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                placeholder={mode === "sign-up" ? "Password (8+ characters)" : "Password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                required
                minLength={mode === "sign-up" ? 8 : undefined}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 font-semibold text-white transition hover:bg-black hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Please wait…"
                : mode === "sign-in"
                  ? "Sign In"
                  : "Create Account"}
              {!submitting && <FiArrowRight size={16} />}
            </button>
          </form>

          {googleEnabled && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  or
                </span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              {/* A link, not a fetch: the browser itself must visit Google. */}
              <a
                href={googleSignInUrl}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-900 transition hover:bg-black/5"
              >
                <FcGoogle size={18} />
                Continue with Google
              </a>
            </>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === "sign-in" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("sign-up")}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
