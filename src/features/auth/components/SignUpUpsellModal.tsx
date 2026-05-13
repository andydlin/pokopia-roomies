import { useAuth } from "../AuthContext";

type Props = {
  onClose: () => void;
  title?: string;
  body?: string;
};

export const SignUpUpsellModal = ({ onClose, title, body }: Props) => {
  const { openAuthModal } = useAuth();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 md:items-center"
      onClick={onClose}
    >
      <section
        className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold tracking-tight text-[var(--pk-text-primary)]">
          {title ?? "Create a free account"}
        </h2>
        <p className="mt-2 text-sm text-[var(--pk-text-desc)]">
          {body ?? "Sign up to save unlimited builds and share them with friends."}
        </p>
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              openAuthModal("sign_up");
            }}
            className="pk-btn pk-btn-primary pk-btn-md w-full"
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              openAuthModal("sign_in");
            }}
            className="pk-btn pk-btn-secondary pk-btn-md w-full"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-[var(--pk-text-desc)] hover:underline"
          >
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
};
