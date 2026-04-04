import { NavLink, Route, Routes } from "react-router-dom";
import { ComparePage } from "../pages/ComparePage";
import { DexPage } from "../pages/DexPage";
import { HomePage } from "../pages/HomePage";
import { ItemsPage } from "../pages/ItemsPage";
import { LookupPage } from "../pages/LookupPage";
import { PokemonDetailPage } from "../pages/PokemonDetailPage";
import { TeamDetailPage } from "../pages/TeamDetailPage";
import { TeamsPage } from "../pages/TeamsPage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive ? "bg-moss text-paper" : "bg-white/70 text-ink hover:bg-white",
  ].join(" ");

export const App = () => (
  <div className="min-h-screen">
    <header className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/45 px-5 py-5 shadow-[0_18px_55px_rgba(17,34,23,0.08)] backdrop-blur md:px-8 md:py-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-moss/70">Pokopia Lab</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Plan smarter Pokopia teams without cross-referencing tabs.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/75 sm:text-base">
              Optimize items, reverse-search Pokemon by constraints, compare teammate fit, and save the teams you want to revisit.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/items" className={navLinkClass}>
              Item Optimizer
            </NavLink>
            <NavLink to="/lookup" className={navLinkClass}>
              Reverse Lookup
            </NavLink>
            <NavLink to="/teams" className={navLinkClass}>
              Teams
            </NavLink>
            <NavLink to="/compare" className={navLinkClass}>
              Compare
            </NavLink>
            <NavLink to="/dex" className={navLinkClass}>
              Dex
            </NavLink>
          </nav>
        </div>
      </div>
    </header>

    <main className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/items" element={<ItemsPage />} />
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
