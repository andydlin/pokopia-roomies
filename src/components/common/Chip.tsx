import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  tone?: "default" | "accent" | "warning" | "none" | "active" | "filter" | "filter-active";
  size?: "standard" | "compact";
  className?: string;
}

export const Chip = ({ children, tone = "default", size = "standard", className = "" }: ChipProps) => {
  const toneClass =
    tone === "accent"
      ? "pk-chip-best"
      : tone === "warning"
        ? "pk-chip-some"
        : tone === "none"
          ? "pk-chip-none"
          : tone === "active"
            ? "pk-chip-category-active"
            : tone === "filter-active"
              ? "pk-chip-filter-active"
              : tone === "filter"
                ? "pk-chip-filter"
            : "pk-chip-category";
  const sizeClass = size === "compact" ? "pk-chip-compact" : "pk-chip-standard";

  return (
    <span className={`pk-chip ${sizeClass} ${toneClass} ${className}`}>
      {children}
    </span>
  );
};
