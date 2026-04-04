import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  tone?: "default" | "accent" | "warning";
}

export const Chip = ({ children, tone = "default" }: ChipProps) => {
  const toneClass =
    tone === "accent"
      ? "bg-moss text-paper border-moss/20"
      : tone === "warning"
        ? "bg-sun/25 text-ink border-sun/20"
        : "bg-white/75 text-ink/80 border-ink/10";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
};
