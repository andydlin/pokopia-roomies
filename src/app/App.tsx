import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HomeBuilderProvider } from "../features/home-builder/state/HomeBuilderContext";
import { HomeBuilderPage } from "../features/home-builder/views/HomeBuilderPage";
import { BuildViewPage } from "../features/home-builder/views/BuildViewPage";
import { PokedexLayout } from "../features/pokedex/views/PokedexLayout";
import { PokedexHabitatsPage, PokedexItemsPage, PokedexPokemonPage } from "../features/pokedex/views/PokedexPages";
import { SavedHomesPage } from "../features/saved-homes/views/SavedHomesPage";

const navLinkClass = (isActive: boolean) =>
  [
    "inline-flex h-8 items-center rounded-[7px] border px-3 text-[14px] tracking-[0.01em] transition-colors",
    isActive
      ? "border-[var(--pk-brand-border)] bg-[var(--pk-brand-light)] font-semibold text-[var(--pk-brand)]"
      : "border-transparent bg-transparent font-normal text-[var(--pk-text-desc)] hover:text-[var(--pk-brand-dark)]",
  ].join(" ");

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

    <Route path="/pokedex" element={<PokedexLayout />}>
      <Route index element={<Navigate to="/pokedex/pokemon" replace />} />
      <Route path="pokemon" element={<PokedexPokemonPage />} />
      <Route path="items" element={<PokedexItemsPage />} />
      <Route path="habitats" element={<PokedexHabitatsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/builder" replace />} />
  </Routes>
);

export const App = () => (
  <HomeBuilderProvider>
    <AppShell />
  </HomeBuilderProvider>
);

const AppShell = () => {
  const location = useLocation();
  const isBuilderActive = location.pathname.startsWith("/builder");
  const isBuilderRoute = location.pathname.startsWith("/builder");
  const isHomesActive = location.pathname.startsWith("/homes");
  const isPokedexActive = location.pathname.startsWith("/pokedex");

  return (
    <div className="min-h-screen bg-[var(--pk-canvas)]">
      <header className="sticky top-0 z-50 w-full border-b border-[var(--pk-border)] bg-[var(--pk-card)] shadow-[var(--pk-shadow-md)]">
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
  );
};
