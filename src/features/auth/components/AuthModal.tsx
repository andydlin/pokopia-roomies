import { type FormEvent, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../AuthContext";

type Flow = "sign_in" | "sign_up" | "nickname_setup";

const USERNAME_RE = /^[a-zA-Z0-9_-]{2,24}$/;

// ─── Icons ────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]";

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minLength?: number;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pk-text-desc)] hover:text-[var(--pk-text-primary)]"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

const OAuthDivider = () => (
  <div className="relative flex items-center gap-3">
    <div className="h-px flex-1 bg-[var(--pk-border)]" />
    <span className="text-xs text-[var(--pk-text-desc)]">or</span>
    <div className="h-px flex-1 bg-[var(--pk-border)]" />
  </div>
);

// ─── Sub-forms ────────────────────────────────────────────────────────────────

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
        className={inputClass}
      />
      <PasswordInput value={password} onChange={setPassword} placeholder="Password" />
      {error && <p className="text-sm text-[var(--pk-destructive-text)]">{error}</p>}
      <button type="submit" disabled={loading} className="pk-btn pk-btn-primary pk-btn-md w-full">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <OAuthDivider />
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
  const { signUp, signInWithGoogle, closeAuthModal } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      setCheckedEmail(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checkedEmail) {
    return (
      <div className="mt-6 space-y-4 text-center">
        <div className="text-5xl">📬</div>
        <p className="text-base font-semibold text-[var(--pk-text-primary)]">Check your email</p>
        <p className="text-sm text-[var(--pk-text-desc)]">
          We sent a confirmation link to{" "}
          <strong className="text-[var(--pk-text-primary)]">{email}</strong>.
          Click it to activate your account — you'll choose your username right after.
        </p>
        <button type="button" onClick={closeAuthModal} className="pk-btn pk-btn-primary pk-btn-md w-full">
          Got it
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ul className="space-y-1 text-sm text-[var(--pk-text-desc)]">
        <li>✓ Unlimited builds synced to the cloud</li>
        <li>✓ Access your builds from any device</li>
        <li>✓ Share builds with a permanent link</li>
      </ul>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <PasswordInput value={password} onChange={setPassword} placeholder="Password (min. 6 characters)" minLength={6} />
        <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm password" />
        {error && <p className="text-sm text-[var(--pk-destructive-text)]">{error}</p>}
        <button type="submit" disabled={loading} className="pk-btn pk-btn-primary pk-btn-md w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
        <OAuthDivider />
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
    </div>
  );
};

const UsernameSetupForm = () => {
  const { closeAuthModal } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!USERNAME_RE.test(username)) {
      setError("Username must be 2–24 characters: letters, numbers, _ or -");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname: username });
      if (upsertError) throw new Error(upsertError.message);
      await supabase.auth.refreshSession();
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <p className="text-sm text-[var(--pk-text-desc)]">
        Choose a username. It will appear as "created by [username]" on builds you share.
      </p>
      <input
        type="text"
        required
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={inputClass}
      />
      {error && <p className="text-sm text-[var(--pk-destructive-text)]">{error}</p>}
      <button type="submit" disabled={loading} className="pk-btn pk-btn-primary pk-btn-md w-full">
        {loading ? "Saving…" : "Save username"}
      </button>
    </form>
  );
};

// ─── Modal shell ──────────────────────────────────────────────────────────────

export const AuthModal = () => {
  const { authModalOpen, authModalIntent, closeAuthModal } = useAuth();
  const [flow, setFlow] = useState<Flow>(authModalIntent);

  if (!authModalOpen) return null;

  const isUsernameSetup = flow === "nickname_setup" || authModalIntent === "nickname_setup";

  const titles: Record<Flow, string> = {
    sign_in: "Sign in",
    sign_up: "Create account",
    nickname_setup: "Choose a username",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 md:items-center"
      onClick={isUsernameSetup ? undefined : closeAuthModal}
    >
      <section
        className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-[var(--pk-text-primary)]">
            {titles[isUsernameSetup ? "nickname_setup" : flow]}
          </h2>
          {!isUsernameSetup && (
            <button
              type="button"
              onClick={closeAuthModal}
              className="rounded-full p-1 text-[var(--pk-text-desc)] hover:bg-[var(--pk-border)] hover:text-[var(--pk-text-primary)]"
              aria-label="Close"
            >
              <XIcon />
            </button>
          )}
        </div>

        {isUsernameSetup ? (
          <UsernameSetupForm />
        ) : flow === "sign_in" ? (
          <SignInForm onSwitch={() => setFlow("sign_up")} />
        ) : (
          <SignUpForm onSwitch={() => setFlow("sign_in")} />
        )}
      </section>
    </div>
  );
};
