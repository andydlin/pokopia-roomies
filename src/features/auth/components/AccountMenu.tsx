import { useRef, useState } from "react";
import { useAuth } from "../AuthContext";

export const AccountMenu = () => {
  const { authState, openAuthModal, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (authState.status === "loading") return null;

  if (authState.status === "guest") {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("sign_in")}
        className="inline-flex h-8 items-center rounded-[7px] border border-transparent px-3 text-[14px] font-normal tracking-[0.01em] text-[var(--pk-text-desc)] transition-colors hover:text-[var(--pk-brand-dark)]"
      >
        Sign in
      </button>
    );
  }

  const initial = authState.user.nickname[0].toUpperCase();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pk-brand)] text-[13px] font-bold text-white"
        aria-label="Account menu"
      >
        {initial}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 min-w-[160px] rounded-xl border border-[var(--pk-border)] bg-white p-1 shadow-lg">
            <p className="px-3 py-2 text-xs font-semibold text-[var(--pk-text-desc)]">
              {authState.user.nickname}
            </p>
            <div className="my-1 h-px bg-[var(--pk-border)]" />
            <button
              type="button"
              onClick={async () => { setOpen(false); await signOut(); }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--pk-text-primary)] hover:bg-[var(--pk-canvas)]"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};
