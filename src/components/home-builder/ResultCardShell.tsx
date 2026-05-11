import type { KeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";

export const ResultCardShell = ({
  onClick,
  onKeyDown,
  className,
  children,
}: {
  onClick: (event: ReactMouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  className: string;
  children: ReactNode;
}) => (
  <article role="button" tabIndex={0} onClick={onClick} onKeyDown={onKeyDown} className={`${className} !rounded-[16px]`.trim()}>
    {children}
  </article>
);

export const ResultCardTitle = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p className={`pk-result-card-title truncate font-semibold text-[var(--pk-text-primary)] ${className}`.trim()}>
    {children}
  </p>
);
