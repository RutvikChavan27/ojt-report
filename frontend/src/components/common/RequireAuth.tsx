import type { ReactNode } from "react";
import Container from "../layout/Container";
import { Link, useLocation } from "react-router-dom";
import { FiLogIn, FiUserPlus } from "react-icons/fi";
import { useAuth } from "../../store/AuthContext";

type RequireAuthProps = {
  /** What the account is needed for, e.g. "post an ad". */
  action: string;
  children: ReactNode;
};

/**
 * Gate for the pages that need an account.
 *
 * Browsing, searching, filtering, sorting and opening a listing are open to
 * everyone; this only ever wraps the rest — posting, saved searches, and the
 * seller dashboard.
 *
 * There is one kind of refusal, because there is one kind of account: nobody is
 * signed in. Anyone signed in may post, so there is no second "your account is
 * the wrong sort" case to express.
 *
 * This is presentation only. Whether a signed-in person may change a particular
 * listing is a question of who owns it, and only the server can answer that —
 * every write endpoint has to check ownership itself regardless of what is
 * shown here.
 */
function RequireAuth({ action, children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = location.pathname + location.search;

  // Waiting on /me. Showing a refusal here would flash it at someone who is in
  // fact signed in, every time they reload the page.
  if (loading) {
    return (
      <Container className="py-12" narrow="md">
        <div className="h-56 animate-pulse rounded-2xl bg-gray-200" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-16" narrow="sm">
        <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.05] text-gray-900">
            <FiLogIn size={22} />
          </span>

          <h1 className="mt-5 text-lg font-black tracking-tight text-gray-900">
            Log in to {action}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
            Browsing and searching are always free. An account is only needed to
            post a listing, save a search, and manage what you have posted.
          </p>

          {/* The intended destination rides along, so signing in returns here
              rather than dumping the visitor on the homepage. */}
          <Link
            to="/login"
            state={{ from }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-black"
          >
            <FiLogIn size={15} />
            Log in
          </Link>

          <Link
            to="/register"
            state={{ from }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 py-3 text-sm font-bold text-gray-900 transition hover:border-gray-900"
          >
            <FiUserPlus size={15} />
            Create an account
          </Link>

          <Link
            to="/search"
            className="mt-5 inline-block text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            Keep browsing instead
          </Link>
        </div>
      </Container>
    );
  }

  return <>{children}</>;
}

export default RequireAuth;
