import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, body, action }: EmptyStateProps) => (
  <div className="card-shell rounded-[2rem] px-6 py-8 text-center">
    <h3 className="type-h2 text-ink">{title}</h3>
    <p className="type-body mt-3 text-ink/65">{body}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
