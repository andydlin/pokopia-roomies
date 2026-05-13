import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { supabase } from "../../lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
};

export type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; user: AuthUser };

type AuthModalIntent = "sign_in" | "sign_up" | "nickname_setup";

type AuthContextValue = {
  authState: AuthState;
  authModalOpen: boolean;
  authModalIntent: AuthModalIntent;
  openAuthModal: (intent: AuthModalIntent) => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchNickname(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", userId)
    .single();
  return data?.nickname ?? null;
}

function isNewUser(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 15_000;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export const AuthProvider = ({
  children,
  onNewAccount,
}: {
  children: React.ReactNode;
  onNewAccount?: (userId: string) => Promise<void>;
}) => {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [authModalOpen, setAuthModalOpen] = useReducer((_: boolean, next: boolean) => next, false);
  const [authModalIntent, setAuthModalIntent] = useState<AuthModalIntent>("sign_in");
  // Guard so the new-account migration only runs once per mount.
  const migratedRef = useRef<Set<string>>(new Set());

  const openAuthModal = useCallback((intent: AuthModalIntent) => {
    setAuthModalIntent(intent);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  useEffect(() => {
    // Hydrate on mount.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthState({ status: "guest" });
        return;
      }
      const nickname = await fetchNickname(session.user.id);
      if (!nickname) {
        // OAuth user who hasn't set a nickname yet.
        setAuthState({ status: "guest" });
        openAuthModal("nickname_setup");
        return;
      }
      setAuthState({
        status: "authenticated",
        user: { id: session.user.id, email: session.user.email ?? "", nickname },
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setAuthState({ status: "guest" });
        return;
      }
      const nickname = await fetchNickname(session.user.id);
      if (!nickname) {
        setAuthState({ status: "guest" });
        openAuthModal("nickname_setup");
        return;
      }
      const user: AuthUser = { id: session.user.id, email: session.user.email ?? "", nickname };
      setAuthState({ status: "authenticated", user });

      // Run migration once for genuinely new accounts.
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        isNewUser(session.user.created_at) &&
        !migratedRef.current.has(session.user.id) &&
        onNewAccount
      ) {
        migratedRef.current.add(session.user.id);
        await onNewAccount(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  // openAuthModal is stable (useCallback with no deps); onNewAccount from parent.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    closeAuthModal();
  }, [closeAuthModal]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string, nickname: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });
    if (error) throw new Error(error.message);
    // Modal stays open — the form transitions to the "check your email" state.
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authState,
      authModalOpen,
      authModalIntent,
      openAuthModal,
      closeAuthModal,
      signInWithEmail,
      signInWithGoogle,
      signUp,
      signOut,
    }),
    [authState, authModalOpen, authModalIntent, openAuthModal, closeAuthModal, signInWithEmail, signInWithGoogle, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
