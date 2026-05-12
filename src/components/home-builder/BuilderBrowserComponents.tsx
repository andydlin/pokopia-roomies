import type { ReactNode } from "react";
import { BuilderResultsListSkeleton } from "./BuilderSkeletons";

/** Sticky search bar wrapper used at the top of each browser tab (items / pokemon). */
export const ResultsBrowserBar = ({ children, strip }: { children: ReactNode; strip?: ReactNode }) => (
  <div className="sticky top-0 z-30 bg-[var(--pk-canvas)]">
    {strip}
    <div className="flex flex-wrap items-center gap-2 pb-4 pt-6">
      {children}
    </div>
  </div>
);

/** A single dismissable filter chip. */
export type ActiveFilterChip = { key: string; label: string; onRemove: () => void };

/** A row of dismissable filter chips with a "Clear all" button. Renders nothing when chips is empty. */
export const ActiveFilterChips = ({
  chips,
  onClearAll,
}: {
  chips: ActiveFilterChip[];
  onClearAll: () => void;
}) =>
  chips.length === 0 ? null : (
    <div className="flex w-full flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="pk-chip pk-chip-standard pk-chip-primary items-center gap-1"
        >
          {chip.label}
          <span aria-hidden>×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="pk-chip pk-chip-standard pk-chip-none transition-colors hover:brightness-[0.98]"
      >
        Clear all
      </button>
    </div>
  );

/** Shows a refreshing skeleton while results are loading, otherwise renders the results list container. */
export const ResultsContent = ({
  isRefreshing,
  children,
}: {
  isRefreshing: boolean;
  children: ReactNode;
}) =>
  isRefreshing ? (
    <div className="mt-4">
      <BuilderResultsListSkeleton />
    </div>
  ) : (
    <div className="mt-4 space-y-8">{children}</div>
  );

/** Animated overflow wrapper applied to each result card to support expand/collapse transitions. */
export const ResultCardOverflowWrapper = ({
  isOverflow,
  isVisible,
  children,
}: {
  isOverflow: boolean;
  isVisible: boolean;
  children: ReactNode;
}) => (
  <div
    className={`${isOverflow && !isVisible ? "overflow-hidden" : "overflow-visible"} transition-[max-height,opacity,transform] duration-500 ease-out ${
      isOverflow
        ? isVisible
          ? "max-h-[220px] opacity-100 translate-y-0"
          : "max-h-0 opacity-0 -translate-y-1"
        : "max-h-[220px] opacity-100 translate-y-0"
    }`}
    style={isOverflow ? { transitionDelay: "0ms" } : undefined}
  >
    {children}
  </div>
);

/** Thumbnail image well shared by item and pokemon result cards. */
export const ResultCardImageWell = ({ src, alt }: { src?: string | null; alt: string }) => (
  <div className="inline-flex shrink-0 items-center justify-center rounded-[var(--pk-radius-lg)] bg-[var(--pk-image-well)] p-2">
    {src ? <img src={src} alt={alt} className="h-12 w-12 object-contain" /> : <div className="h-12 w-12" />}
  </div>
);

/** "See all / Show less" expansion toggle rendered at the bottom of a collapsible section. */
export const SeeAllToggle = ({
  show,
  isExpanded,
  isCollapsing,
  hiddenCount,
  onToggle,
}: {
  show: boolean;
  isExpanded: boolean;
  isCollapsing: boolean;
  hiddenCount: number;
  onToggle: () => void;
}) =>
  !show ? null : (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        className="pk-chip-count h-9 transition-colors hover:brightness-[0.98]"
      >
        {isExpanded && !isCollapsing ? "Show less" : `See all (${hiddenCount} more)`}
      </button>
    </div>
  );
