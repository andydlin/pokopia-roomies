import { favoriteCategories } from "../../data/favoriteCategories";
import { habitatTraits } from "../../data/habitatTraits";
import { items } from "../../data/items";
import { specialties } from "../../data/specialties";
import type { LookupFilters as LookupFiltersState } from "../../lib/types";

export const LookupFilters = ({
  filters,
  onChange,
}: {
  filters: LookupFiltersState;
  onChange: (next: LookupFiltersState) => void;
}) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
    <input
      value={filters.query}
      onChange={(event) => onChange({ ...filters, query: event.target.value })}
      placeholder="Search Pokemon"
      className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
    />
    <select
      value={filters.favoriteCategoryId}
      onChange={(event) => onChange({ ...filters, favoriteCategoryId: event.target.value })}
      className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
    >
      <option value="all">All categories</option>
      {favoriteCategories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
    <select
      value={filters.itemId}
      onChange={(event) => onChange({ ...filters, itemId: event.target.value })}
      className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
    >
      <option value="all">All items</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
    <select
      value={filters.habitatTraitId}
      onChange={(event) => onChange({ ...filters, habitatTraitId: event.target.value })}
      className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
    >
      <option value="all">All habitat traits</option>
      {habitatTraits.map((trait) => (
        <option key={trait.id} value={trait.id}>
          {trait.label}
        </option>
      ))}
    </select>
    <select
      value={filters.specialtyId}
      onChange={(event) => onChange({ ...filters, specialtyId: event.target.value })}
      className="rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-moss"
    >
      <option value="all">All specialties</option>
      {specialties.map((specialty) => (
        <option key={specialty.id} value={specialty.id}>
          {specialty.name}
        </option>
      ))}
    </select>
  </div>
);
