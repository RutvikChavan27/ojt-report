import { useState } from "react";
import { FiX, FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";

type AuthModalProps = {
  onClose: () => void;
};

type AuthMode = "sign-in" | "sign-up";

function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");

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
              onClick={() => setMode("sign-in")}
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
              onClick={() => setMode("sign-up")}
              className={`flex-1 rounded-full py-2 transition ${
                mode === "sign-up"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onClose();
            }}
          >
            {mode === "sign-up" && (
              <div className="relative mt-5">
                <FiUser
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Full name"
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
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 font-semibold text-white transition hover:bg-black hover:shadow-lg"
            >
              {mode === "sign-in" ? "Sign In" : "Create Account"}
              <FiArrowRight size={16} />
            </button>
          </form>

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
