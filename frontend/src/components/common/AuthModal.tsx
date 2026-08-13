import { FiUser, FiX } from "react-icons/fi";
import AuthForm from "./AuthForm";

type AuthModalProps = {
  onClose: () => void;
};

/**
 * The navbar's sign-in dialog. Only the shell lives here — the form itself is
 * {@link AuthForm}, shared with the checkout login step.
 */
function AuthModal({ onClose }: AuthModalProps) {
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

          <h2 className="mt-4 text-2xl font-black tracking-tight">Welcome</h2>
          <p className="mt-1 text-sm text-gray-300">
            Sign in to track orders and saved items.
          </p>
        </div>

        <div className="px-7 pb-7 pt-6">
          <AuthForm onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
