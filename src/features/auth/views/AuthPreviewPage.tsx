import { useState } from "react";

// ─── Shared primitives (copied from AuthModal for standalone preview) ──────────

const inputClass =
  "w-full rounded-lg border border-[var(--pk-border)] bg-[var(--pk-canvas)] px-3 py-2 text-sm text-[var(--pk-text-primary)] outline-none focus:border-[var(--pk-brand)]";

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PasswordInput = ({ placeholder }: { placeholder: string }) => {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pk-text-desc)] hover:text-[var(--pk-text-primary)]"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
};

const OAuthDivider = () => (
  <div className="relative flex items-center gap-3">
    <div className="h-px flex-1 bg-[var(--pk-border)]" /><span className="text-xs text-[var(--pk-text-desc)]">or</span><div className="h-px flex-1 bg-[var(--pk-border)]" />
  </div>
);

// ─── Panel wrapper ─────────────────────────────────────────────────────────────

const Panel = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--pk-text-desc)]">{label}</p>
    <section className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-lg">
      {children}
    </section>
  </div>
);

const ModalHeader = ({ title, showClose = true }: { title: string; showClose?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-lg font-bold tracking-tight text-[var(--pk-text-primary)]">{title}</h2>
    {showClose && <button type="button" className="pk-btn pk-btn-secondary pk-btn-sm">Close</button>}
  </div>
);

// ─── Auth state previews ───────────────────────────────────────────────────────

const SignInPreview = () => (
  <Panel label="Sign In">
    <ModalHeader title="Sign in" />
    <div className="mt-5 space-y-3">
      <input type="email" placeholder="Email" className={inputClass} />
      <PasswordInput placeholder="Password" />
      <button className="pk-btn pk-btn-primary pk-btn-md w-full">Sign in</button>
      <OAuthDivider />
      <button className="pk-btn pk-btn-secondary pk-btn-md w-full">Continue with Google</button>
      <p className="text-center text-sm text-[var(--pk-text-desc)]">
        No account?{" "}
        <span className="font-semibold text-[var(--pk-brand)]">Sign up</span>
      </p>
    </div>
  </Panel>
);

const SignUpPreview = () => (
  <Panel label="Sign Up">
    <ModalHeader title="Create account" />
    <div className="mt-4">
      <ul className="space-y-1 text-sm text-[var(--pk-text-desc)]">
        <li>✓ Unlimited builds synced to the cloud</li>
        <li>✓ Access your builds from any device</li>
        <li>✓ Share builds with a permanent link</li>
      </ul>
      <div className="mt-4 space-y-3">
        <input type="text" placeholder="Nickname (shown on shared builds)" className={inputClass} />
        <input type="email" placeholder="Email" className={inputClass} />
        <PasswordInput placeholder="Password (min. 6 characters)" />
        <button className="pk-btn pk-btn-primary pk-btn-md w-full">Create account</button>
        <OAuthDivider />
        <button className="pk-btn pk-btn-secondary pk-btn-md w-full">Continue with Google</button>
        <p className="text-center text-sm text-[var(--pk-text-desc)]">
          Already have an account?{" "}
          <span className="font-semibold text-[var(--pk-brand)]">Sign in</span>
        </p>
      </div>
    </div>
  </Panel>
);

const CheckEmailPreview = () => (
  <Panel label="Sign Up → Check Email">
    <ModalHeader title="Create account" />
    <div className="mt-6 space-y-4 text-center">
      <div className="text-5xl">📬</div>
      <p className="text-base font-semibold text-[var(--pk-text-primary)]">Check your email</p>
      <p className="text-sm text-[var(--pk-text-desc)]">
        We sent a confirmation link to{" "}
        <strong className="text-[var(--pk-text-primary)]">you@example.com</strong>.
        Click it to activate your account.
      </p>
      <button className="pk-btn pk-btn-primary pk-btn-md w-full">Got it</button>
    </div>
  </Panel>
);

const NicknameSetupPreview = () => (
  <Panel label="Nickname Setup (post-Google OAuth)">
    <ModalHeader title="Choose a nickname" showClose={false} />
    <div className="mt-5 space-y-3">
      <p className="text-sm text-[var(--pk-text-desc)]">
        Choose a nickname. It will appear as "created by [nickname]" on builds you share.
      </p>
      <input type="text" placeholder="Nickname" className={inputClass} />
      <button className="pk-btn pk-btn-primary pk-btn-md w-full">Save nickname</button>
    </div>
  </Panel>
);

const UpsellPreview = () => (
  <Panel label="Sign Up Upsell (guest trying to copy a build)">
    <h2 className="text-lg font-bold tracking-tight text-[var(--pk-text-primary)]">Sign up to copy this build</h2>
    <p className="mt-2 text-sm text-[var(--pk-text-desc)]">
      Create a free account to save this build to your collection and keep planning.
    </p>
    <div className="mt-5 space-y-2">
      <button className="pk-btn pk-btn-primary pk-btn-md w-full">Create account</button>
      <button className="pk-btn pk-btn-secondary pk-btn-md w-full">Sign in</button>
      <button className="w-full text-center text-sm text-[var(--pk-text-desc)] hover:underline">Maybe later</button>
    </div>
  </Panel>
);

const CallbackLoadingPreview = () => (
  <Panel label="Auth Callback — Loading">
    <p className="text-sm text-[var(--pk-text-desc)]">Signing you in…</p>
  </Panel>
);

const CallbackSuccessPreview = () => (
  <Panel label="Auth Callback — Success">
    <div className="space-y-2">
      <p className="text-lg font-bold text-[var(--pk-text-primary)]">You're in!</p>
      <p className="text-sm text-[var(--pk-text-desc)]">Taking you to the builder…</p>
    </div>
  </Panel>
);

const SignInErrorPreview = () => (
  <Panel label="Sign In — Error state">
    <ModalHeader title="Sign in" />
    <div className="mt-5 space-y-3">
      <input type="email" defaultValue="wrong@example.com" className={inputClass} />
      <PasswordInput placeholder="Password" />
      <p className="text-sm text-[var(--pk-destructive-text)]">Invalid login credentials</p>
      <button className="pk-btn pk-btn-primary pk-btn-md w-full">Sign in</button>
      <OAuthDivider />
      <button className="pk-btn pk-btn-secondary pk-btn-md w-full">Continue with Google</button>
    </div>
  </Panel>
);

// ─── Page ──────────────────────────────────────────────────────────────────────

export const AuthPreviewPage = () => (
  <div className="min-h-screen bg-[var(--pk-canvas)] px-6 py-10">
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--pk-text-desc)]">Dev only</p>
    <h1 className="mb-8 text-2xl font-extrabold tracking-tight text-[var(--pk-text-primary)]">Auth UI Preview</h1>
    <div className="flex flex-wrap gap-8">
      <SignInPreview />
      <SignUpPreview />
      <CheckEmailPreview />
      <NicknameSetupPreview />
      <UpsellPreview />
      <SignInErrorPreview />
      <CallbackLoadingPreview />
      <CallbackSuccessPreview />
    </div>
  </div>
);
