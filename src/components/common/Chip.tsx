import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  tone?: "primary" | "default" | "accent" | "warning";
  size?: "standard" | "compact";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Chip = ({ children, tone = "primary", size = "standard", className = "", onClick, disabled }: ChipProps) => {
  const toneClass =
    tone === "accent"
      ? "pk-chip-best"
      : tone === "warning"
        ? "pk-chip-some"
        : tone === "default"
          ? "pk-chip-default"
          : "pk-chip-primary";
  const sizeClass = size === "compact" ? "pk-chip-compact" : "pk-chip-standard";
  const classes = `pk-chip ${sizeClass} ${toneClass} ${className}`;

  if (onClick !== undefined) {
    return (
      <button type="button" className={classes} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <span className={classes}>
      {children}
    </span>
  );
};
