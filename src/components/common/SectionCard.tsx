import type { ReactNode } from "react";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export const SectionCard = ({ eyebrow, title, description, children }: SectionCardProps) => (
  <section className="card-shell rounded-[2rem] p-5">
    {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss/60">{eyebrow}</p> : null}
    <h2 className="mt-1 text-2xl font-semibold text-ink">{title}</h2>
    {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/68">{description}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);
