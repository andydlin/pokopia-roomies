import { type FormEvent, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../AuthContext";

type Flow = "sign_in" | "sign_up" | "nickname_setup";

const NICKNAME_RE = /^[a-zA-Z0-9_-]{2,24}$/;

// ─── Sub-forms ───────────────────────────────────────────────────────────────

const SignInForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]"
      />
      {error && <p className="text-sm text-[var(--pk-destructive-text)]">{error}</p>}
      <button type="submit" disabled={loading} className="pk-btn pk-btn-primary pk-btn-md w-full">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--pk-border)]" />
        <span className="text-xs text-[var(--pk-text-desc)]">or</span>
        <div className="h-px flex-1 bg-[var(--pk-border)]" />
      </div>
      <button type="button" onClick={signInWithGoogle} className="pk-btn pk-btn-secondary pk-btn-md w-full">
        Continue with Google
      </button>
      <p className="text-center text-sm text-[var(--pk-text-desc)]">
        No account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-[var(--pk-brand)] hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
};

const SignUpForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!NICKNAME_RE.test(nickname)) {
      setError("Nickname must be 2–24 characters: letters, numbers, _ or -");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, nickname);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <input
        type="text"
        required
        placeholder="Nickname (shown on shared builds)"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]"
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]"
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Password (min. 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]"
      />
      {error && <p className="text-sm text-[var(--pk-destructive-text)]">{error}</p>}
      <button type="submit" disabled={loading} className="pk-btn pk-btn-primary pk-btn-md w-full">
        {loading ? "Creating account…" : "Create account"}
      </button>
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--pk-border)]" />
        <span className="text-xs text-[var(--pk-text-desc)]">or</span>
        <div className="h-px flex-1 bg-[var(--pk-border)]" />
      </div>
      <button type="button" onClick={signInWithGoogle} className="pk-btn pk-btn-secondary pk-btn-md w-full">
        Continue with Google
      </button>
      <p className="text-center text-sm text-[var(--pk-text-desc)]">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-[var(--pk-brand)] hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
};

const NicknameSetupForm = () => {
  const { closeAuthModal } = useAuth();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!NICKNAME_RE.test(nickname)) {
      setError("Nickname must be 2–24 characters: letters, numbers, _ or -");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname });
      if (upsertError) throw new Error(upsertError.message);
      // Trigger a session refresh so onAuthStateChange fires and re-fetches the nickname.
      await supabase.auth.refreshSession();
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save nickname.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <p className="text-sm text-[var(--pk-text-desc)]">
        Choose a nickname. It will appear as "created by [nickname]" on builds you share.
      </p>
      <input
        type="text"
        required
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]"
      />
      {error && <p className="text-sm text-[var(--pk-destructive-text)]">{error}</p>}
      <button type="submit" disabled={loading} className="pk-btn pk-btn-primary pk-btn-md w-full">
        {loading ? "Saving…" : "Save nickname"}
      </button>
    </form>
  );
};

// ─── Modal shell ─────────────────────────────────────────────────────────────

export const AuthModal = () => {
  const { authModalOpen, authModalIntent, closeAuthModal } = useAuth();
  const [flow, setFlow] = useState<Flow>(authModalIntent);

  // Sync external intent changes (e.g. "Sign in" vs "Create account" buttons).
  // Using a key on the modal would also work but this avoids remounting.
  if (!authModalOpen) return null;

  const isNicknameSetup = flow === "nickname_setup" || authModalIntent === "nickname_setup";

  const titles: Record<Flow, string> = {
    sign_in: "Sign in",
    sign_up: "Create account",
    nickname_setup: "Choose a nickname",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 md:items-center"
      onClick={isNicknameSetup ? undefined : closeAuthModal}
    >
      <section
        className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-[var(--pk-text-primary)]">
            {titles[isNicknameSetup ? "nickname_setup" : flow]}
          </h2>
          {!isNicknameSetup && (
            <button type="button" onClick={closeAuthModal} className="pk-btn pk-btn-secondary pk-btn-sm">
              Close
            </button>
          )}
        </div>

        {isNicknameSetup ? (
          <NicknameSetupForm />
        ) : flow === "sign_in" ? (
          <SignInForm onSwitch={() => setFlow("sign_up")} />
        ) : (
          <SignUpForm onSwitch={() => setFlow("sign_in")} />
        )}
      </section>
    </div>
  );
};
