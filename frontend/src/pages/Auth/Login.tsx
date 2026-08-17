import { useState } from "react";
import Container from "../../components/layout/Container";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { googleSignInUrl } from "../../lib/api";
import { useAuth } from "../../store/AuthContext";

/**
 * Sign-in.
 *
 * One door, because there is one kind of account. What a signed-in person may
 * do is decided per action rather than at the login form: posting and saved
 * searches need only an account, and changing a listing needs to own it.
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, googleEnabled } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Both fields start read-only, and stop being so the moment either is
   * touched.
   *
   * Chrome fills a login form on page load whenever exactly one credential is
   * saved for the origin, and no autocomplete token prevents it — `off` is
   * explicitly ignored on login forms. What it does skip is a read-only field,
   * so the form opens empty; the attribute is dropped on first focus, which is
   * before the saved-credential dropdown is offered, so picking an account and
   * having the password filled in behaves exactly as normal afterwards.
   *
   * Deliberately not solved with `new-password`: that stops the password
   * manager offering to save or update the password at all, which is the
   * opposite of what is wanted.
   */
  const [autofillLocked, setAutofillLocked] = useState(true);
  const unlockAutofill = () => setAutofillLocked(false);

  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigate(from ?? "/home");
    } catch (err) {
      // The server's wording is written to be read, so show it as-is.
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";
  const icon =
    "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400";

  return (
    <Container className="py-12" narrow="sm">
      <div className="rounded-2xl border border-gray-200 bg-white p-7">
        <h1 className="text-xl font-black tracking-tight text-gray-900">
          Log in to Bazaar
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          To post listings, save searches and manage what you have posted.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative">
            <FiMail size={16} className={icon} />
            <input
              type="email"
              name="email"
              id="login-email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              // "username" is the token password managers look for on a login
              // form; "email" alone is matched less reliably.
              autoComplete="username"
              readOnly={autofillLocked}
              // Both: focus covers tabbing in, and pointerdown fires before the
              // click that opens the suggestion list, so the field is already
              // editable by the time Chrome decides whether to offer it.
              onFocus={unlockAutofill}
              onPointerDown={unlockAutofill}
              required
              className={field}
            />
          </div>

          <div className="relative mt-4">
            <FiLock size={16} className={icon} />
            <input
              type="password"
              name="password"
              id="login-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              readOnly={autofillLocked}
              onFocus={unlockAutofill}
              onPointerDown={unlockAutofill}
              required
              className={field}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-gray-300 bg-black/[0.03] px-4 py-2.5 text-sm text-gray-900"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Please wait…" : "Log in"}
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
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-gray-300 py-3 text-sm font-semibold text-gray-900 transition hover:bg-black/[0.03]"
            >
              <FcGoogle size={18} />
              Continue with Google
            </a>
          </>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          New to Bazaar?{" "}
          <Link to="/register" className="font-bold text-gray-900 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </Container>
  );
}

export default Login;
