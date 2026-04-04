import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, body, action }: EmptyStateProps) => (
  <div className="card-shell rounded-[2rem] px-6 py-8 text-center">
    <h3 className="text-2xl font-semibold text-ink">{title}</h3>
    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink/65">{body}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
