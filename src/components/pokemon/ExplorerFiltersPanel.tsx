import type { ExplorerFilterOption, ExplorerFilters, ExplorerSortOption } from "../../lib/types";
import { Chip } from "../common/Chip";

interface ExplorerFiltersPanelProps {
  filters: ExplorerFilters;
  sort: ExplorerSortOption;
  onFiltersChange: (next: ExplorerFilters) => void;
  onSortChange: (next: ExplorerSortOption) => void;
  favoriteOptions: ExplorerFilterOption[];
  habitatOptions: ExplorerFilterOption[];
  specialtyOptions: ExplorerFilterOption[];
}

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

const FilterGroup = ({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: ExplorerFilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) => (
  <div className="space-y-3">
    <h3 className="type-overline text-moss/70">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onToggle(option.value)}>
          <Chip tone={selected.includes(option.value) ? "accent" : "default"}>
            {option.label} ({option.count})
          </Chip>
        </button>
      ))}
    </div>
  </div>
);

export const ExplorerFiltersPanel = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  favoriteOptions,
  habitatOptions,
  specialtyOptions,
}: ExplorerFiltersPanelProps) => (
  <div className="space-y-5">
    <div className="grid gap-3">
      <input
        value={filters.query}
        onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })}
        placeholder="Search name, number, habitat, specialty, favorites, tags"
        className="type-ui w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
      />
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as ExplorerSortOption)}
        className="type-ui rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 outline-none transition focus:border-moss"
      >
        <option value="compatibility-potential-desc">Compatibility potential</option>
        <option value="number-asc">Pokedex number</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="specialty-count-desc">Specialty count</option>
        <option value="favorites-count-desc">Favorites count</option>
      </select>
    </div>

    <FilterGroup
      title="Favorites"
      options={favoriteOptions}
      selected={filters.favorites}
      onToggle={(value) => onFiltersChange({ ...filters, favorites: toggleValue(filters.favorites, value) })}
    />
    <FilterGroup
      title="Ideal Habitat"
      options={habitatOptions}
      selected={filters.idealHabitats}
      onToggle={(value) =>
        onFiltersChange({ ...filters, idealHabitats: toggleValue(filters.idealHabitats, value) })
      }
    />
    <FilterGroup
      title="Specialties"
      options={specialtyOptions}
      selected={filters.specialties}
      onToggle={(value) =>
        onFiltersChange({ ...filters, specialties: toggleValue(filters.specialties, value) })
      }
    />
  </div>
);
