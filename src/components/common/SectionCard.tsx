import type { ReactNode } from "react";

interface SectionCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export const SectionCard = ({ eyebrow, title, description, children }: SectionCardProps) => (
  <section className="card-shell rounded-[2rem] p-5">
    {eyebrow ? <p className="type-overline text-moss/60">{eyebrow}</p> : null}
    <h2 className="type-h2 mt-1 text-ink">{title}</h2>
    {description ? <p className="type-body mt-2 text-ink/68">{description}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);
