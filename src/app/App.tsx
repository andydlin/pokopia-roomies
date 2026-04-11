import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ComparePage } from "../pages/ComparePage";
import { DexPage } from "../pages/DexPage";
import { HomePage } from "../pages/HomePage";
import { BuildersPage } from "../pages/BuildersPage";
import { HabitatsPage } from "../pages/HabitatsPage";
import { ItemsPage } from "../pages/ItemsPage";
import { LookupPage } from "../pages/LookupPage";
import { PokemonDetailPage } from "../pages/PokemonDetailPage";
import { TeamDetailPage } from "../pages/TeamDetailPage";
import { TeamsPage } from "../pages/TeamsPage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "relative rounded-lg text-sm uppercase tracking-[0.04em] transition-colors",
    isActive ? "font-black !text-[#5894D6]" : "font-medium !text-[#3d565d] hover:!text-[#2f4851]",
  ].join(" ");

export const App = () => (
  <div className="min-h-screen">
    <header className="w-full mb-10">
      <div className="mx-auto flex w-full max-w-[2000px] items-start justify-between px-4 sm:px-6 lg:px-10">
        <div className="overflow-visible rounded-b-[16px] bg-white px-[6px] pb-[6px] shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="overflow-visible rounded-b-[12px] border-[2px] border-t-0 border-dashed border-black/10 bg-white px-4 pb-1 pt-2">
            <Link to="/" aria-label="Go to home">
              <img src="/assets/logo.png" alt="PokopiaDex logo" className="h-10 w-[155px] object-contain" />
            </Link>
          </div>
        </div>

        <nav className="overflow-visible rounded-b-[16px] bg-white px-[6px] pb-[6px] shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <div className="flex items-start gap-8 overflow-visible rounded-b-[12px] border-[2px] border-t-0 border-dashed border-black/10 bg-white px-8 py-4">
            <NavLink to="/dex" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative inline-block">
                  {isActive ? (
                    <span className="pointer-events-none absolute left-1/2 -top-3.5 h-2 w-4 -translate-x-1/2 rounded-b-full bg-[#5894D6]" />
                  ) : null}
                  pokedex
                </span>
              )}
            </NavLink>
            <NavLink to="/items" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative inline-block">
                  {isActive ? (
                    <span className="pointer-events-none absolute left-1/2 -top-3.5 h-2 w-4 -translate-x-1/2 rounded-b-full bg-[#5894D6]" />
                  ) : null}
                  items
                </span>
              )}
            </NavLink>
            <NavLink to="/habitats" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative inline-block">
                  {isActive ? (
                    <span className="pointer-events-none absolute left-1/2 -top-3.5 h-2 w-4 -translate-x-1/2 rounded-b-full bg-[#5894D6]" />
                  ) : null}
                  habitats
                </span>
              )}
            </NavLink>
            <NavLink to="/builder" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative inline-block">
                  {isActive ? (
                    <span className="pointer-events-none absolute left-1/2 -top-3.5 h-2 w-4 -translate-x-1/2 rounded-b-full bg-[#5894D6]" />
                  ) : null}
                  builder
                </span>
              )}
            </NavLink>
            <NavLink to="/teams" className={navLinkClass}>
              {({ isActive }) => (
                <span className="relative inline-block">
                  {isActive ? (
                    <span className="pointer-events-none absolute left-1/2 -top-3.5 h-2 w-4 -translate-x-1/2 rounded-b-full bg-[#5894D6]" />
                  ) : null}
                  saved
                </span>
              )}
            </NavLink>
          </div>
        </nav>
      </div>
    </header>

    <main className="mx-auto w-full max-w-[2000px] px-4 pb-12 sm:px-6 lg:px-10">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/builder" element={<BuildersPage />} />
        <Route path="/roomies" element={<Navigate to="/builder" replace />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/habitats" element={<HabitatsPage />} />
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="/pokemon/:slug" element={<PokemonDetailPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:id" element={<TeamDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/dex" element={<DexPage />} />
      </Routes>
    </main>
  </div>
);
