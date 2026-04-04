import type { SummaryLabel } from "../../lib/types";

const toneClass: Record<SummaryLabel, string> = {
  excellent: "bg-moss text-paper",
  good: "bg-sky text-ink",
  mixed: "bg-sun/80 text-ink",
  poor: "bg-berry/85 text-paper",
};

export const ScoreBadge = ({ score, label }: { score: number; label: SummaryLabel }) => (
  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${toneClass[label]}`}>
    <span>{score}</span>
    <span className="capitalize">{label}</span>
  </div>
);
