import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "@untitledui/icons";
import { useIsTouchDevice } from "../../hooks/useIsTouchDevice";

export const AddedItemStrip = ({
  items,
  onRemove,
  className,
  style,
}: {
  items: Array<{ id: string; name: string; image?: string | null; generalCategoryLabel?: string | null }>;
  onRemove: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const isTouch = useIsTouchDevice();

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    const label = item.generalCategoryLabel ?? "Other";
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 2);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className={`hidden md:block py-2 ${className ?? ""}`} style={style}>
      <div className="rounded-[16px] border border-[var(--pk-border)] bg-[var(--pk-card)] shadow-[var(--pk-shadow-md)]">
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="text-[12px] font-semibold text-[var(--pk-text-primary)]">{items.length} {items.length === 1 ? "item" : "items"}</span>
        {Object.entries(categoryCounts).sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => (
          <span key={label} className="text-[12px] text-[var(--pk-text-desc)]">· {label} {count}</span>
        ))}
      </div>
      <div className="relative flex items-start gap-1 px-2 pb-2">
        <div
          ref={scrollRef}
          className={`flex gap-3 pt-2 pl-2 ${isExpanded ? "flex-wrap" : "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}`}
        >
          {items.map((item) => (
            <div key={item.id} className="group/strip relative flex shrink-0 flex-col items-center gap-1 w-[48px]">
              <div className="relative flex h-[48px] w-[48px] items-center justify-center rounded-[10px] bg-[var(--pk-border)] p-1">
                {item.image
                  ? <img src={item.image} alt={item.name} className="h-8 w-8 object-contain" />
                  : <div className="h-8 w-8 rounded-[6px] bg-[var(--pk-border)]" />}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className={`absolute -right-1.5 -top-1.5 h-[20px] w-[20px] items-center justify-center rounded-full border border-[var(--pk-border)] bg-[var(--pk-card)] text-[var(--pk-text-desc)] transition-colors hover:text-[var(--pk-text-primary)] ${isTouch ? "flex" : "hidden group-hover/strip:flex"}`}
                >
                  <span className="text-sm leading-none">×</span>
                </button>
              </div>
              <p className="w-full truncate text-center text-[10px] leading-tight text-[var(--pk-text-desc)]">{item.name}</p>
            </div>
          ))}
        </div>
        {(hasOverflow || isExpanded) ? (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="ml-auto mt-1 flex shrink-0 items-center gap-1 rounded-[6px] px-2 py-1 text-xs font-medium text-[var(--pk-text-desc)] transition-colors hover:text-[var(--pk-text-primary)]"
            aria-label={isExpanded ? "Collapse item strip" : "Expand item strip"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      </div>
    </div>
  );
};
