import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  tone?: "primary" | "default" | "accent" | "warning";
  size?: "standard" | "compact";
  className?: string;
}

export const Chip = ({ children, tone = "primary", size = "standard", className = "" }: ChipProps) => {
  const toneClass =
    tone === "accent"
      ? "pk-chip-best"
      : tone === "warning"
        ? "pk-chip-some"
        : tone === "default"
          ? "pk-chip-default"
          : "pk-chip-primary";
  const sizeClass = size === "compact" ? "pk-chip-compact" : "pk-chip-standard";

  return (
    <span className={`pk-chip ${sizeClass} ${toneClass} ${className}`}>
      {children}
    </span>
  );
};
