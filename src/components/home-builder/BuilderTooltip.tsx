const CompactImageTooltip = ({
  items,
  keyPrefix,
}: {
  items: Array<{ id: string; name: string; imageUrl?: string | null }>;
  keyPrefix: string;
}) => {
  if (items.length === 0) return null;
  return (
    <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-[100] inline-flex w-max max-w-[220px] -translate-x-1/2 translate-y-1 rounded-[12px] border border-[#DBEAFE] bg-[#FFFFFF] p-2 opacity-0 shadow-[0_8px_24px_rgba(59,130,246,0.14),0_2px_8px_rgba(0,0,0,0.06)] transition-[opacity,transform] duration-150 ease-out group-hover/overlap:translate-y-0 group-hover/overlap:opacity-100 group-hover/pktooltip:translate-y-0 group-hover/pktooltip:opacity-100">
      <span className="absolute -bottom-[7px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-[#DBEAFE]" />
      <span className="absolute -bottom-[5.5px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#FFFFFF]" />
      <span className="flex max-w-[204px] flex-wrap items-center justify-center gap-1.5">
        {items.slice(0, 8).map((item) => (
          <span key={`${keyPrefix}-${item.id}`} className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--pk-image-well)]">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-5 w-5 object-contain" /> : null}
          </span>
        ))}
      </span>
    </span>
  );
};

export const OverlapTooltip = ({
  items,
  tooltipKeyPrefix,
}: {
  items: Array<{ id: string; name: string; imageUrl?: string | null }>;
  tooltipKeyPrefix: string;
}) => <CompactImageTooltip items={items} keyPrefix={tooltipKeyPrefix} />;
