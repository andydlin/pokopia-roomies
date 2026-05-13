import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HomeBuilderPage } from "../features/home-builder/views/HomeBuilderPage";
import { BuildViewPage } from "../features/home-builder/views/BuildViewPage";
import { PublicBuildPage } from "../features/public-builds/views/PublicBuildPage";
import { PokedexLayout } from "../features/pokedex/views/PokedexLayout";
import { PokedexHabitatsPage, PokedexItemsPage, PokedexPokemonPage } from "../features/pokedex/views/PokedexPages";
import { SavedHomesPage } from "../features/saved-homes/views/SavedHomesPage";
import { DesignSystemPage } from "../features/design-system/views/DesignSystemPage";
import { AuthCallbackPage } from "../features/auth/views/AuthCallbackPage";
import { AuthPreviewPage } from "../features/auth/views/AuthPreviewPage";
import { AuthModal } from "../features/auth/components/AuthModal";
import { AccountMenu } from "../features/auth/components/AccountMenu";
import { IntroModal } from "../features/home-builder/components/IntroModal";
import { useAuth } from "../features/auth/AuthContext";

const navLinkClass = (isActive: boolean) =>
  [
    "inline-flex h-8 items-center rounded-[7px] border px-3 text-[14px] tracking-[0.01em] transition-colors",
    isActive
      ? "border-[var(--pk-brand-border)] bg-[var(--pk-brand-light)] font-semibold text-[var(--pk-brand)]"
      : "border-transparent bg-transparent font-normal text-[var(--pk-text-desc)] hover:text-[var(--pk-brand-dark)]",
  ].join(" ");

const LOCAL_SESSION_STORAGE_KEY = "pokopia.home-builder.session.v1";
const APP_SHELL_SKELETON_MIN_MS = 300;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/builder" replace />} />
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
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/design-system" element={<DesignSystemPage />} />
    <Route path="/auth-preview" element={<AuthPreviewPage />} />

    <Route path="/pokedex" element={<PokedexLayout />}>
      <Route index element={<Navigate to="/pokedex/pokemon" replace />} />
      <Route path="pokemon" element={<PokedexPokemonPage />} />
      <Route path="items" element={<PokedexItemsPage />} />
      <Route path="habitats" element={<PokedexHabitatsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/builder" replace />} />
  </Routes>
);

export const App = () => <AppShell />;

const AppShell = () => {
  const location = useLocation();
  const { authModalOpen } = useAuth();
  const isBuilderActive = location.pathname.startsWith("/builder");
  const isBuilderRoute = location.pathname.startsWith("/builder");
  const isHomesActive = location.pathname.startsWith("/homes");
  const isPokedexActive = location.pathname.startsWith("/pokedex");
  const isDesignSystemRoute = location.pathname.startsWith("/design-system") || location.pathname.startsWith("/auth-preview");
  const [showAppShellSkeleton, setShowAppShellSkeleton] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return !window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
    } catch {
      return true;
    }
  });

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
        <header className="relative sm:sticky sm:top-0 z-50 w-full border-b border-[var(--pk-border)] bg-[var(--pk-card)] shadow-[var(--pk-shadow-md)]">
          <div className="flex h-[52px] w-full items-center justify-between px-5 sm:px-8 lg:px-10">
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
              <Link to="/builder/pokemon" className={navLinkClass(isBuilderActive)}>
                Home Builder
              </Link>
              <Link to="/homes" className={navLinkClass(isHomesActive)}>
                Saved Homes
              </Link>
              <Link to="/pokedex/pokemon" className={navLinkClass(isPokedexActive)}>
                Pokedex
              </Link>
              <AccountMenu />
            </nav>
          </div>
        </header>

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
