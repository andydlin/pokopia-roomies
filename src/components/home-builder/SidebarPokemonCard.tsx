type SidebarPokemonCardChip = {
  id: string;
  label: string;
  isSelected: boolean;
  tone: "primary" | "default";
  onToggle: () => void;
};

export const SidebarPokemonCard = ({
  name,
  subtitle,
  imageUrl,
  onRemove,
  chips,
}: {
  name: string;
  subtitle: string;
  imageUrl?: string | null;
  onRemove: () => void;
  chips: SidebarPokemonCardChip[];
}) => (
  <article className="group relative rounded-[16px] border border-[var(--pk-border)] bg-white p-2 transition-colors duration-150 hover:border-[#2563EB]">
    <div className="flex w-full items-center gap-3 text-left">
      <div className="rounded-[12px] bg-[var(--pk-border)] p-1.5">
        {imageUrl ? <img src={imageUrl} alt={name} className="h-8 w-8 object-contain" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-[#485864]">{name}</p>
        <p className="truncate text-xs text-[#6c889b]">{subtitle}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="pk-btn pk-btn-secondary pk-btn-icon pk-btn-sm absolute -right-2 -top-2 rounded-full border-[#b3c9d2] text-[#6c889b] opacity-0 transition-opacity hover:text-[#485864] group-hover:opacity-100 focus-visible:opacity-100"
      aria-label={`Remove ${name}`}
    >
      <span className="block h-5 w-5 text-center text-lg leading-[20px]">×</span>
    </button>
    {chips.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={chip.isSelected}
            onClick={chip.onToggle}
            className={`pk-chip pk-chip-standard transition-colors ${chip.tone === "primary" ? "pk-chip-best" : "pk-chip-default"}`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    ) : null}
  </article>
);
