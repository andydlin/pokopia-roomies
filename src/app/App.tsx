import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { HomeBuilderLoader } from "../features/home-builder/state/HomeBuilderLoader";
import { HomeBuilderPage } from "../features/home-builder/views/HomeBuilderPage";
import { BuildViewPage } from "../features/home-builder/views/BuildViewPage";
import { PublicBuildPage } from "../features/public-builds/views/PublicBuildPage";
import { PokedexLayout } from "../features/pokedex/views/PokedexLayout";
import { PokedexHabitatsPage, PokedexItemsPage, PokedexPokemonPage } from "../features/pokedex/views/PokedexPages";
import { ItemDetailPage } from "../pages/ItemDetailPage";
import { SavedHomesPage } from "../features/saved-homes/views/SavedHomesPage";
import { DesignSystemPage } from "../features/design-system/views/DesignSystemPage";
import { AuthCallbackPage } from "../features/auth/views/AuthCallbackPage";
import { AuthPreviewPage } from "../features/auth/views/AuthPreviewPage";
import { AuthModal } from "../features/auth/components/AuthModal";
import { AccountMenu } from "../features/auth/components/AccountMenu";
import { IntroModal } from "../features/home-builder/components/IntroModal";
import { useAuth } from "../features/auth/AuthContext";

// Layout wrapper: only routes that need builder state wait for HomeBuilderLoader.
// Non-builder pages (auth-preview, design-system, pokedex, auth/callback) render immediately.
const HomeBuilderLayout = () => (
  <HomeBuilderLoader>
    <Outlet />
  </HomeBuilderLoader>
);

const navLinkClass = (isActive: boolean) =>
  [
    "inline-flex h-8 items-center rounded-[7px] border px-3 text-[12px] tracking-[0.01em] transition-colors",
    isActive
      ? "border-transparent bg-transparent font-semibold text-[var(--pk-text-primary)]"
      : "border-transparent bg-transparent font-medium text-[var(--pk-text-desc)] hover:text-[var(--pk-brand-dark)]",
  ].join(" ");

const LOCAL_SESSION_STORAGE_KEY = "pokopia.home-builder.session.v1";
const APP_SHELL_SKELETON_MIN_MS = 300;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/builder" replace />} />

    {/* Routes that need HomeBuilder state — wait for auth + data load */}
    <Route element={<HomeBuilderLayout />}>
      <Route path="/builder">
        <Route index element={<Navigate to="/builder/pokemon" replace />} />
        <Route path="pokemon" element={<HomeBuilderPage />} />
        <Route path="items" element={<Navigate to="/builder/items/comfort" replace />} />
        <Route path="items/comfort" element={<HomeBuilderPage />} />
        <Route path="items/other" element={<HomeBuilderPage />} />
        <Route path="favorites" element={<HomeBuilderPage />} />
        <Route path="habitats" element={<Navigate to="/builder/favorites" replace />} />
      </Route>
      <Route path="/homes/view" element={<BuildViewPage />} />
      <Route path="/homes" element={<SavedHomesPage />} />
      <Route path="/builds/:buildId" element={<PublicBuildPage />} />
    </Route>

    {/* Routes that render immediately — no HomeBuilder context needed */}
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/design-system" element={<DesignSystemPage />} />
    <Route path="/auth-preview" element={<AuthPreviewPage />} />

    <Route path="/pokedex" element={<PokedexLayout />}>
      <Route index element={<Navigate to="/pokedex/pokemon" replace />} />
      <Route path="pokemon" element={<PokedexPokemonPage />} />
      <Route path="items" element={<PokedexItemsPage />} />
      <Route path="items/:itemId" element={<ItemDetailPage />} />
      <Route path="habitats" element={<PokedexHabitatsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/builder" replace />} />
  </Routes>
);

export const App = () => <AppShell />;

const AppShell = () => {
  const location = useLocation();
  const { authModalOpen, authState, signOut, openAuthModal } = useAuth();
  const isBuilderActive = location.pathname.startsWith("/builder");
  const isBuilderRoute = location.pathname.startsWith("/builder");
  const isHomesActive = location.pathname.startsWith("/homes");
  const isPokedexActive = location.pathname.startsWith("/pokedex");
  const isDesignSystemRoute = location.pathname.startsWith("/design-system") || location.pathname.startsWith("/auth-preview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAppShellSkeleton, setShowAppShellSkeleton] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!showAppShellSkeleton) return;
    const timeout = window.setTimeout(() => setShowAppShellSkeleton(false), APP_SHELL_SKELETON_MIN_MS);
    return () => window.clearTimeout(timeout);
  }, [showAppShellSkeleton]);

  if (isDesignSystemRoute) {
    return (
      <div className="min-h-screen bg-[var(--pk-canvas)]">
        <main className="w-full">
          <AppRoutes />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--pk-canvas)]">
      {authModalOpen && <AuthModal />}
      {isBuilderRoute && <IntroModal />}

      <div
        className={`transition-opacity duration-200 ${
          showAppShellSkeleton ? "opacity-100" : "pointer-events-none absolute inset-0 z-50 opacity-0"
        }`}
        aria-hidden={!showAppShellSkeleton}
      >
        <header className="flex h-[52px] w-full items-center gap-6 border-b border-[#DBEAFE] bg-white px-6">
          <div className="pk-skeleton h-[22px] w-[110px] rounded-[6px]" />
          <div className="pk-skeleton ml-auto h-[14px] w-[80px] rounded-[4px]" />
          <div className="pk-skeleton h-[14px] w-[80px] rounded-[4px]" />
          <div className="pk-skeleton h-[14px] w-[80px] rounded-[4px]" />
        </header>
      </div>

      <div className={`transition-opacity duration-200 ${showAppShellSkeleton ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <header className="relative sm:sticky sm:top-0 z-50 w-full border-b border-[var(--pk-border)] bg-[var(--pk-card)]">
          <div className="flex h-[52px] w-full items-center justify-between px-4 lg:px-10">
            <Link
              to="/builder"
              aria-label="Go to Home Builder"
              className="text-[20px] font-extrabold tracking-[-0.02em] leading-none"
              style={{ fontFamily: "\"M PLUS Rounded 1c\", sans-serif" }}
            >
              <span className="text-[#003691]">Pokopia</span>
              <span className="text-[#1277FE]">Lab</span>
            </Link>

            <nav className="flex items-center gap-1.5">
              {/* Desktop nav links — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1.5">
                <Link to="/builder/pokemon" className={navLinkClass(isBuilderActive)}>
                  Home Builder
                </Link>
                <Link to="/homes" className={navLinkClass(isHomesActive)}>
                  Saved Homes
                </Link>
                <Link to="/pokedex/pokemon" className={navLinkClass(isPokedexActive)}>
                  Pokedex
                </Link>
              </div>
              {/* Account menu — desktop only */}
              <div className="hidden sm:flex">
                <AccountMenu inactiveLinkClass={navLinkClass(false)} />
              </div>
              {/* Hamburger — mobile only */}
              <button
                type="button"
                className="sm:hidden flex h-8 w-8 items-center justify-center rounded-[7px] text-[var(--pk-text-desc)] hover:text-[var(--pk-brand-dark)] transition-colors"
                onClick={() => setMobileMenuOpen((o) => !o)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </nav>
          </div>
        </header>

        {/* Mobile full-screen menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--pk-card)] sm:hidden">
            {/* Header row */}
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--pk-border)] px-5">
              <Link
                to="/builder"
                className="text-[20px] font-extrabold tracking-[-0.02em] leading-none"
                style={{ fontFamily: "\"M PLUS Rounded 1c\", sans-serif" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-[#003691]">Pokopia</span>
                <span className="text-[#1277FE]">Lab</span>
              </Link>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[var(--pk-text-desc)] hover:text-[var(--pk-brand-dark)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Signed in as */}
            {authState.status === "authenticated" && (
              <div className="border-b border-[var(--pk-border)] px-5 py-4">
                <p className="text-[12px] text-[var(--pk-text-desc)]">Signed in as</p>
                <p className="text-[16px] font-bold text-[var(--pk-text-primary)]">{authState.user.nickname}</p>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex flex-col">
              <Link
                to="/builder/pokemon"
                className={`flex h-14 items-center px-5 text-[16px] font-medium transition-colors ${isBuilderActive ? "font-semibold text-[var(--pk-text-primary)]" : "text-[var(--pk-text-desc)]"}`}
              >
                Home Builder
              </Link>
              <div className="mx-5 h-px bg-[var(--pk-border)]" />
              <Link
                to="/homes"
                className={`flex h-14 items-center px-5 text-[16px] font-medium transition-colors ${isHomesActive ? "font-semibold text-[var(--pk-text-primary)]" : "text-[var(--pk-text-desc)]"}`}
              >
                Saved Homes
              </Link>
              <div className="mx-5 h-px bg-[var(--pk-border)]" />
              <Link
                to="/pokedex/pokemon"
                className={`flex h-14 items-center px-5 text-[16px] font-medium transition-colors ${isPokedexActive ? "font-semibold text-[var(--pk-text-primary)]" : "text-[var(--pk-text-desc)]"}`}
              >
                Pokedex
              </Link>
              <div className="mx-5 h-px bg-[var(--pk-border)]" />
              {authState.status === "authenticated" ? (
                <button
                  type="button"
                  onClick={async () => { setMobileMenuOpen(false); await signOut(); }}
                  className="flex h-14 w-full items-center px-5 text-[16px] font-medium text-[var(--pk-text-desc)] transition-colors hover:text-[var(--pk-text-primary)]"
                >
                  Sign out
                </button>
              ) : authState.status === "guest" ? (
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); openAuthModal("sign_in"); }}
                  className="flex h-14 w-full items-center px-5 text-[16px] font-medium text-[var(--pk-text-desc)] transition-colors"
                >
                  Sign in
                </a>
              ) : null}
            </nav>
          </div>
        )}

        <main
          className={
            isBuilderRoute
              ? "w-full pb-0 pt-0"
              : "mx-auto w-full max-w-[2000px] px-5 pb-12 pt-0 sm:px-8 lg:px-10"
          }
        >
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};
