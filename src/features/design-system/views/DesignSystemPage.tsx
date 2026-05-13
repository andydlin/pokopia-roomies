import { useEffect, useMemo, useState } from "react";
import { Chip } from "../../../components/common/Chip";
import { EmptyState } from "../../../components/common/EmptyState";
import { ScoreBadge } from "../../../components/common/ScoreBadge";
import { SectionCard } from "../../../components/common/SectionCard";
import { BuilderSearchField, FavoritesToggle, SortSegmentedControl } from "../../../components/home-builder/BuilderControls";
import { OverlapTooltip } from "../../../components/home-builder/BuilderTooltip";
import { ResultCardShell, ResultCardTitle } from "../../../components/home-builder/ResultCardShell";
import { SidebarPokemonCard } from "../../../components/home-builder/SidebarPokemonCard";
import { BuilderResultsSkeleton, BuilderSidebarSkeleton } from "../../../components/home-builder/BuilderSkeletons";
import { ActiveFilterChips, ResultsBrowserBar, ResultsContent, ResultCardImageWell, ResultCardOverflowWrapper, SeeAllToggle } from "../../../components/home-builder/BuilderBrowserComponents";
import { Tooltip } from "../../../components/common/Tooltip";

type Token = {
  name: string;
  cssVar: string;
  note: string;
};

const tokenGroups: Array<{ id: string; title: string; tokens: Token[] }> = [
  {
    id: "brand",
    title: "Brand",
    tokens: [
      { name: "Brand Primary", cssVar: "--pk-brand", note: "CTAs, active states, primary buttons, toggles" },
      { name: "Brand Secondary", cssVar: "--pk-brand-dark", note: "Section headers, nav active, chip text" },
      { name: "Brand Light", cssVar: "--pk-brand-light", note: "Soft surfaces and table/card fills" },
      { name: "Brand Border", cssVar: "--pk-brand-border", note: "Active borders and focus rings" },
    ],
  },
  {
    id: "surface",
    title: "Surfaces",
    tokens: [
      { name: "Canvas", cssVar: "--pk-canvas", note: "App/page background" },
      { name: "Card", cssVar: "--pk-card", note: "Cards, modals, drawers, inputs" },
      { name: "Border", cssVar: "--pk-border", note: "Card borders, input borders, dividers" },
      { name: "Image Well", cssVar: "--pk-image-well", note: "Pokemon and item sprite wells" },
    ],
  },
  {
    id: "text",
    title: "Text",
    tokens: [
      { name: "Primary Text", cssVar: "--pk-text-primary", note: "Primary headings and important body text" },
      { name: "Secondary Text", cssVar: "--pk-text-desc", note: "Supportive text and metadata" },
      { name: "Muted Text", cssVar: "--pk-text-muted", note: "Placeholder and low emphasis text" },
    ],
  },
  {
    id: "signals",
    title: "Semantic Signals",
    tokens: [
      { name: "Best Match", cssVar: "--pk-best-bg", note: "High confidence match chips and states" },
      { name: "Some Overlap", cssVar: "--pk-some-bg", note: "Medium confidence overlap states" },
      { name: "No Overlap", cssVar: "--pk-none-bg", note: "Neutral and non-overlap states" },
      { name: "Destructive", cssVar: "--pk-destructive-bg", note: "Danger actions and destructive prompts" },
    ],
  },
];

const spacingTokens = [
  "--pk-space-1",
  "--pk-space-2",
  "--pk-space-3",
  "--pk-space-4",
  "--pk-space-6",
  "--pk-space-8",
  "--pk-space-12",
];

const radiusTokens = [
  "--pk-radius-sm",
  "--pk-radius-md",
  "--pk-radius-lg",
  "--pk-radius-xl",
  "--pk-radius-2xl",
  "--pk-radius-pill",
];

const sectionNav = [
  { id: "color-system", label: "01 Color System" },
  { id: "typography", label: "02 Typography" },
  { id: "spacing", label: "03 Spacing & Radius" },
  { id: "components", label: "04 Components" },
  { id: "browser-components", label: "05 Browser Components" },
  { id: "semantic-signals", label: "06 Semantic Signals" },
];

const allTokenVars = [
  ...new Set([
    ...tokenGroups.flatMap((group) => group.tokens.map((token) => token.cssVar)),
    ...spacingTokens,
    ...radiusTokens,
    "--pk-font-display",
    "--pk-font-body",
    "--pk-font-mono",
  ]),
];

const parsePxValue = (value: string) => {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const TokenCard = ({
  token,
  currentValue,
}: {
  token: Token;
  currentValue: string;
}) => {
  return (
    <article className="rounded-[10px] border border-[var(--pk-border)] bg-[var(--pk-card)]">
      <div className="h-14 rounded-t-[10px] border-b border-[var(--pk-border)]" style={{ backgroundColor: `var(${token.cssVar})` }} />
      <div className="space-y-1.5 p-3">
        <h4 className="text-[12px] font-semibold text-[var(--pk-text-primary)]">{token.name}</h4>
        <p className="text-[11px] font-semibold text-[var(--pk-brand)]">{token.cssVar}</p>
        <p className="text-[11px] text-[var(--pk-text-desc)]">{currentValue}</p>
        <p className="text-[11px] text-[var(--pk-text-desc)]">{token.note}</p>
      </div>
    </article>
  );
};

export const DesignSystemPage = () => {
  const [cssVarValues, setCssVarValues] = useState<Record<string, string>>({});
  const [searchValue, setSearchValue] = useState("");
  const [showDetailsEnabled, setShowDetailsEnabled] = useState(true);
  const [sortModePreview, setSortModePreview] = useState<"suggested" | "az">("suggested");
  const [activeSidebarFavoriteChips, setActiveSidebarFavoriteChips] = useState<string[]>(["construction"]);
  const [activeFilterChips, setActiveFilterChips] = useState<string[]>(["construction", "exercise"]);
  const [overflowVisible, setOverflowVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const computed = window.getComputedStyle(document.documentElement);
    const nextValues: Record<string, string> = {};
    allTokenVars.forEach((tokenVar) => {
      nextValues[tokenVar] = computed.getPropertyValue(tokenVar).trim() || "(unset)";
    });
    setCssVarValues(nextValues);
  }, []);

  const spacingVisuals = useMemo(
    () =>
      spacingTokens.map((tokenVar) => {
        const value = cssVarValues[tokenVar] ?? "(unset)";
        const px = parsePxValue(value);
        return { tokenVar, value, px };
      }),
    [cssVarValues],
  );

  const radiusVisuals = useMemo(
    () =>
      radiusTokens.map((tokenVar) => ({
        tokenVar,
        value: cssVarValues[tokenVar] ?? "(unset)",
      })),
    [cssVarValues],
  );

  return (
    <div className="mx-auto w-full max-w-[1800px] px-5 pb-12 pt-4 sm:px-8 lg:px-10">
      <section className="rounded-[10px] border border-[var(--pk-border)] bg-[var(--pk-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--pk-border)] px-4 py-2 text-[12px]">
          <span className="text-[var(--pk-text-desc)]">Design System</span>
          <span className="text-[var(--pk-text-muted)]">/</span>
          <span className="font-semibold text-[var(--pk-brand)]">Pokopia Roomies</span>
        </div>

        <div className="grid min-h-[calc(100vh-180px)] grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="border-r border-[var(--pk-border)] bg-[#F8FBFF] p-4">
            <nav className="space-y-1">
              {sectionNav.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-[8px] px-3 py-2 text-[12px] text-[var(--pk-text-desc)] transition-colors hover:bg-[var(--pk-brand-light)] hover:text-[var(--pk-brand)]"
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="space-y-8 bg-[var(--pk-canvas)] p-6 lg:p-8">
            <header className="space-y-4 border-b border-[var(--pk-border)] pb-6">
              <div>
                <h1 className="text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--pk-text-primary)]">Pokopia Roomies</h1>
                <p className="mt-1 text-[24px] text-[var(--pk-brand)]">Design System - Live Token Set</p>
              </div>
              <p className="max-w-[940px] text-[14px] leading-[1.5] text-[var(--pk-text-desc)]">
                This page is generated from the current codebase. Tokens are read live from CSS variables and component previews use
                real shared components/classes only.
              </p>
            </header>

            <section id="color-system" className="space-y-4">
              <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--pk-text-primary)]">01 Color System</h2>
              <p className="text-[14px] text-[var(--pk-text-desc)]">Every color token maps directly to a live CSS variable value.</p>
              {tokenGroups.map((group) => (
                <div key={group.id} className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">{group.title}</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {group.tokens.map((token) => (
                      <TokenCard key={token.cssVar} token={token} currentValue={cssVarValues[token.cssVar] ?? "(unset)"} />
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section id="typography" className="space-y-4 border-t border-[var(--pk-border)] pt-6">
              <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--pk-text-primary)]">02 Typography</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Display / Heading</p>
                  <p className="type-display text-[var(--pk-text-primary)]">Display</p>
                  <p className="type-h1 mt-2 text-[var(--pk-text-primary)]">Heading 1</p>
                  <p className="type-h2 mt-2 text-[var(--pk-text-primary)]">Heading 2</p>
                  <p className="type-h3 mt-2 text-[var(--pk-text-primary)]">Heading 3</p>
                </div>
                <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Body / Utility</p>
                  <p className="type-body text-[var(--pk-text-desc)]">Body text style for longer readable content.</p>
                  <p className="type-ui mt-2 text-[var(--pk-text-primary)]">UI text for controls and labels.</p>
                  <p className="type-caption mt-2 text-[var(--pk-text-desc)]">Caption text for helper copy.</p>
                  <p className="type-overline mt-2 text-[var(--pk-text-desc)]">Overline Label</p>
                </div>
              </div>
            </section>

            <section id="spacing" className="space-y-4 border-t border-[var(--pk-border)] pt-6">
              <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--pk-text-primary)]">03 Spacing & Radius</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Spacing Scale</p>
                  <div className="space-y-2.5">
                    {spacingVisuals.map(({ tokenVar, value, px }) => (
                      <div key={tokenVar} className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-[var(--pk-text-primary)]">
                            {tokenVar}: {value}
                          </span>
                          <div className="h-3 rounded-[4px] bg-[var(--pk-brand-light)]" style={{ width: `${Math.max(px, 8)}px` }} />
                        </div>
                        <span className="text-[11px] text-[var(--pk-text-desc)]">{px > 0 ? `${px}px` : "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Radius Scale</p>
                  <div className="grid gap-2">
                    {radiusVisuals.map(({ tokenVar, value }) => (
                      <div key={tokenVar} className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <span className="font-mono text-[12px] text-[var(--pk-text-primary)]">
                          {tokenVar}: {value}
                        </span>
                        <div
                          className="h-8 w-12 border border-[var(--pk-border)] bg-[var(--pk-brand-light)]"
                          style={{ borderRadius: `var(${tokenVar})` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="components" className="space-y-4 border-t border-[var(--pk-border)] pt-6">
              <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--pk-text-primary)]">04 Components</h2>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Builder Search Field (shared)</p>
                <BuilderSearchField value={searchValue} onChange={setSearchValue} placeholder="Search Pokemon" />
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Show Details Toggle (shared)</p>
                <FavoritesToggle checked={showDetailsEnabled} onToggle={() => setShowDetailsEnabled((value) => !value)} label="Show details" />
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Sort Segmented Control (shared)</p>
                <SortSegmentedControl
                  activeValue={sortModePreview}
                  onSuggested={() => setSortModePreview("suggested")}
                  onAlphabetical={() => setSortModePreview("az")}
                />
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Buttons (pk-btn classes)</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="pk-btn pk-btn-primary pk-btn-md">Primary</button>
                  <button type="button" className="pk-btn pk-btn-secondary pk-btn-md">Secondary</button>
                  <button type="button" className="pk-btn pk-btn-soft pk-btn-md">Soft</button>
                  <button type="button" className="pk-btn pk-btn-ghost pk-btn-md">Ghost</button>
                  <button type="button" className="pk-btn pk-btn-destructive pk-btn-md">Destructive</button>
                </div>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Chip component (src/components/common/Chip.tsx)</p>
                <p className="mb-3 text-[12px] text-[var(--pk-text-desc)]">Pass <code className="font-mono text-[var(--pk-brand)]">onClick</code> to get a clickable <code className="font-mono text-[var(--pk-brand)]">&lt;button&gt;</code> with hover and active states. Omit it for a static <code className="font-mono text-[var(--pk-brand)]">&lt;span&gt;</code>.</p>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold text-[var(--pk-text-muted)]">Static</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip tone="primary">Primary</Chip>
                      <Chip tone="accent">Best</Chip>
                      <Chip tone="warning">Some</Chip>
                      <Chip tone="default">Default</Chip>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold text-[var(--pk-text-muted)]">Clickable (hover me)</p>
                    <div className="flex flex-wrap gap-2">
                      <Chip tone="primary" onClick={() => {}}>Primary</Chip>
                      <Chip tone="accent" onClick={() => {}}>Best</Chip>
                      <Chip tone="warning" onClick={() => {}}>Some</Chip>
                      <Chip tone="default" onClick={() => {}}>Default</Chip>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Tooltip (src/components/common/Tooltip.tsx)</p>
                <p className="mb-4 text-[12px] text-[var(--pk-text-desc)]">Wraps any element and shows a text tooltip on hover. Supports <code className="font-mono text-[var(--pk-brand)]">side="top"</code> (default) and <code className="font-mono text-[var(--pk-brand)]">side="bottom"</code>.</p>
                <div className="flex flex-wrap items-end gap-6">
                  <div className="flex flex-col items-start gap-1">
                    <code className="text-[11px] text-[var(--pk-text-desc)]">side="top"</code>
                    <Tooltip content="Helpful hint about this action">
                      <button type="button" className="pk-btn pk-btn-secondary pk-btn-md">Hover me</button>
                    </Tooltip>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <code className="text-[11px] text-[var(--pk-text-desc)]">side="bottom"</code>
                    <Tooltip content="Appears below the trigger" side="bottom">
                      <button type="button" className="pk-btn pk-btn-secondary pk-btn-md">Hover me</button>
                    </Tooltip>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <code className="text-[11px] text-[var(--pk-text-desc)]">wrapping a chip</code>
                    <Tooltip content="Favorite category: Construction">
                      <span className="pk-chip pk-chip-compact pk-chip-primary">Construction</span>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Overlap Tooltip (shared)</p>
                <span className="group/overlap relative inline-flex">
                  <button type="button" className="pk-chip pk-chip-standard pk-chip-default">
                    Hover to preview tooltip
                  </button>
                  <OverlapTooltip
                    tooltipKeyPrefix="design-system-tooltip-preview"
                    items={[
                      { id: "bulbasaur", name: "Bulbasaur", imageUrl: "/assets/pokopia-pokemon/001.png" },
                      { id: "pikachu", name: "Pikachu", imageUrl: "/assets/pokopia-pokemon/025.png" },
                      { id: "ditto", name: "Ditto", imageUrl: "/assets/pokopia-pokemon/132.png" },
                    ]}
                  />
                </span>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Result Card Shell (shared)</p>
                <ResultCardShell
                  onClick={() => {}}
                  onKeyDown={() => {}}
                  className="rounded-[var(--pk-radius-md)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-[10px] shadow-[var(--pk-shadow-sm)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex shrink-0 items-center justify-center rounded-[var(--pk-radius-lg)] bg-[var(--pk-image-well)] p-2">
                      <img src="/assets/pokopia-pokemon/448.png" alt="Lucario" className="h-12 w-12 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <ResultCardTitle>Demo Result Card</ResultCardTitle>
                      <p className="text-xs text-[var(--pk-text-desc)]">Utility · Matches 2 Pokemon</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="pk-chip pk-chip-compact pk-chip-primary">Construction</span>
                        <span className="pk-chip pk-chip-compact pk-chip-none">Luxury</span>
                      </div>
                    </div>
                  </div>
                </ResultCardShell>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Sidebar Pokemon Card (shared)</p>
                <div className="max-w-[360px]">
                  <SidebarPokemonCard
                    name="Poliwrath"
                    subtitle="Humid · 3 shared favorites"
                    imageUrl="/assets/pokopia-pokemon/062.png"
                    onRemove={() => {}}
                    chips={
                      showDetailsEnabled
                        ? [
                            { id: "construction", label: "Construction", isSelected: activeSidebarFavoriteChips.includes("construction"), tone: "primary" as const, onToggle: () => setActiveSidebarFavoriteChips((prev) => (prev.includes("construction") ? prev.filter((id) => id !== "construction") : [...prev, "construction"])) },
                            { id: "exercise", label: "Exercise", isSelected: activeSidebarFavoriteChips.includes("exercise"), tone: "default" as const, onToggle: () => setActiveSidebarFavoriteChips((prev) => (prev.includes("exercise") ? prev.filter((id) => id !== "exercise") : [...prev, "exercise"])) },
                            { id: "group_activities", label: "Group Activities", isSelected: activeSidebarFavoriteChips.includes("group_activities"), tone: "primary" as const, onToggle: () => setActiveSidebarFavoriteChips((prev) => (prev.includes("group_activities") ? prev.filter((id) => id !== "group_activities") : [...prev, "group_activities"])) },
                          ]
                        : []
                    }
                  />
                </div>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Builder Results Skeleton (shared)</p>
                <BuilderResultsSkeleton />
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">Builder Sidebar Skeleton (shared)</p>
                <BuilderSidebarSkeleton />
              </div>
            </section>

            <section id="browser-components" className="space-y-4 border-t border-[var(--pk-border)] pt-6">
              <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--pk-text-primary)]">05 Browser Components</h2>
              <p className="text-[14px] text-[var(--pk-text-desc)]">Shared layout and interaction primitives used across the items and pokemon browser tabs.</p>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">ResultsBrowserBar (shared)</p>
                <p className="mb-3 text-[12px] text-[var(--pk-text-desc)]">Sticky search bar wrapper. Sticks to the top of its scroll container with the canvas background.</p>
                <ResultsBrowserBar>
                  <BuilderSearchField value="" onChange={() => {}} placeholder="Search items" />
                  <FavoritesToggle checked={showDetailsEnabled} onToggle={() => setShowDetailsEnabled((v) => !v)} label="Show details" />
                  <SortSegmentedControl activeValue={sortModePreview} onSuggested={() => setSortModePreview("suggested")} onAlphabetical={() => setSortModePreview("az")} />
                </ResultsBrowserBar>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">ActiveFilterChips (shared)</p>
                <p className="mb-3 text-[12px] text-[var(--pk-text-desc)]">Dismissable filter chips row. Renders nothing when the chips array is empty.</p>
                <ActiveFilterChips
                  chips={activeFilterChips.map((id) => ({
                    key: id,
                    label: id.charAt(0).toUpperCase() + id.slice(1),
                    onRemove: () => setActiveFilterChips((prev) => prev.filter((c) => c !== id)),
                  }))}
                  onClearAll={() => setActiveFilterChips([])}
                />
                {activeFilterChips.length === 0 ? (
                  <button type="button" className="pk-btn pk-btn-secondary pk-btn-sm" onClick={() => setActiveFilterChips(["construction", "exercise"])}>
                    Reset chips
                  </button>
                ) : null}
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">ResultCardImageWell (shared)</p>
                <p className="mb-3 text-[12px] text-[var(--pk-text-desc)]">Rounded image well for pokemon and item thumbnails. Shows a blank placeholder when src is absent.</p>
                <div className="flex gap-3">
                  <ResultCardImageWell src="/assets/pokopia-pokemon/448.png" alt="Lucario" />
                  <ResultCardImageWell src={null} alt="Empty" />
                </div>
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">ResultCardOverflowWrapper + SeeAllToggle (shared)</p>
                <p className="mb-3 text-[12px] text-[var(--pk-text-desc)]">Animated overflow wrapper for expand/collapse transitions on result cards.</p>
                <div className="space-y-2">
                  <ResultCardOverflowWrapper isOverflow={false} isVisible={true}>
                    <div className="rounded-[var(--pk-radius-md)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-3 text-[12px] text-[var(--pk-text-primary)]">Always visible card</div>
                  </ResultCardOverflowWrapper>
                  <ResultCardOverflowWrapper isOverflow={true} isVisible={overflowVisible}>
                    <div className="rounded-[var(--pk-radius-md)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-3 text-[12px] text-[var(--pk-text-primary)]">Overflow card — animates in/out</div>
                  </ResultCardOverflowWrapper>
                </div>
                <SeeAllToggle
                  show={true}
                  isExpanded={overflowVisible}
                  isCollapsing={false}
                  hiddenCount={4}
                  onToggle={() => setOverflowVisible((v) => !v)}
                />
              </div>
              <div className="rounded-[12px] border border-[var(--pk-border)] bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pk-text-desc)]">ResultsContent (shared)</p>
                <p className="mb-3 text-[12px] text-[var(--pk-text-desc)]">Shows a refreshing skeleton while <code className="font-mono text-[var(--pk-brand)]">isRefreshing</code> is true, otherwise wraps children in the standard results list container.</p>
                <ResultsContent isRefreshing={false}>
                  <div className="rounded-[var(--pk-radius-md)] border border-[var(--pk-border)] bg-[var(--pk-card)] p-3 text-[12px] text-[var(--pk-text-desc)]">Results list container (mt-4 space-y-8)</div>
                </ResultsContent>
              </div>
            </section>

            <section id="semantic-signals" className="space-y-4 border-t border-[var(--pk-border)] pt-6">
              <h2 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--pk-text-primary)]">06 Semantic Signals</h2>
              <div className="flex flex-wrap gap-2">
                <ScoreBadge score={94} label="excellent" />
                <ScoreBadge score={78} label="good" />
                <ScoreBadge score={61} label="mixed" />
                <ScoreBadge score={38} label="poor" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard eyebrow="Shared Primitive" title="SectionCard" description="Live SectionCard usage from the common component.">
                  <div className="rounded-[10px] border border-[var(--pk-border)] bg-[var(--pk-brand-light)] p-3 text-[12px] text-[var(--pk-text-desc)]">
                    Section content preview
                  </div>
                </SectionCard>
                <EmptyState
                  title="EmptyState"
                  body="Live EmptyState usage from the common component."
                  action={
                    <button type="button" className="pk-btn pk-btn-primary pk-btn-sm">
                      Add First Item
                    </button>
                  }
                />
              </div>
            </section>

          </main>
        </div>
      </section>
    </div>
  );
};
