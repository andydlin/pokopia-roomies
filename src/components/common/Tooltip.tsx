import { type ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
};

export const Tooltip = ({ content, children, side = "top" }: TooltipProps) => (
  <span className="group/tooltip relative inline-flex">
    {children}
    <span
      className={`pointer-events-none absolute left-1/2 z-[100] w-max max-w-[200px] -translate-x-1/2 rounded-[8px] border border-[var(--pk-border)] bg-[var(--pk-card)] px-2.5 py-1.5 text-[11px] leading-[1.4] text-[var(--pk-text-primary)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover/tooltip:opacity-100 ${
        side === "top"
          ? "bottom-[calc(100%+8px)] translate-y-1 group-hover/tooltip:translate-y-0"
          : "top-[calc(100%+8px)] -translate-y-1 group-hover/tooltip:translate-y-0"
      }`}
    >
      {content}
      {side === "top" ? (
        <>
          <span className="absolute -bottom-[5px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[var(--pk-border)]" />
          <span className="absolute -bottom-[3.5px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-[var(--pk-card)]" />
        </>
      ) : (
        <>
          <span className="absolute -top-[5px] left-1/2 h-0 w-0 -translate-x-1/2 border-b-[5px] border-l-[5px] border-r-[5px] border-b-[var(--pk-border)] border-l-transparent border-r-transparent" />
          <span className="absolute -top-[3.5px] left-1/2 h-0 w-0 -translate-x-1/2 border-b-[4px] border-l-[4px] border-r-[4px] border-b-[var(--pk-card)] border-l-transparent border-r-transparent" />
        </>
      )}
    </span>
  </span>
);
