import { NavLink, Outlet } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `type-ui rounded-full px-4 py-2 ${isActive ? "bg-moss text-paper" : "border border-ink/10 bg-white"}`;

export const PokedexLayout = () => (
  <div className="space-y-4">
    <div className="rounded-3xl border border-white/70 bg-white/85 p-3">
      <p className="type-overline text-moss/60">Neutral browse</p>
      <h2 className="type-h2 mt-1 text-ink">Pokedex</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <NavLink to="/pokedex/pokemon" className={navClass}>
          Pokemon
        </NavLink>
        <NavLink to="/pokedex/items" className={navClass}>
          Items
        </NavLink>
        <NavLink to="/pokedex/habitats" className={navClass}>
          Habitats
        </NavLink>
      </div>
    </div>
    <Outlet />
  </div>
);
