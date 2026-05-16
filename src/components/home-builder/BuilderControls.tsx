import { useEffect, useRef, useState } from "react";
import { SearchRefraction } from "@untitledui/icons";

export const FavoritesToggle = ({
  checked,
  onToggle,
  label = "Show Favorites",
  disabled = false,
}: {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label="Toggle favorites"
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    className={`group inline-flex h-10 items-center justify-between gap-3 rounded-[9px] border border-[#DBEAFE] bg-[#FFFFFF] px-3 text-left transition-opacity duration-150 ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
  >
    <span className="flex min-w-[86px] leading-none">
      <span className="text-xs font-medium text-[#1E3A5F]">{label}</span>
    </span>
    <span
      className={`relative inline-flex h-6 w-[42px] rounded-[999px] transition-[background] duration-200 ease-out ${
        checked ? "bg-[#2563EB] group-focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]" : "bg-[#E2E8F0]"
      }`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-[#FFFFFF] shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition-[left] duration-200 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
          checked ? "left-[21px]" : "left-[3px]"
        }`}
      />
    </span>
  </button>
);

export const BuilderSearchField = ({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (next: string) => void;
}) => {
  const hasValue = value.trim().length > 0;
  return (
    <label className="group/search flex h-10 w-full items-center gap-2 rounded-[9px] border-[1.5px] border-[#DBEAFE] bg-[#FFFFFF] px-[13px] shadow-[0_1px_3px_rgba(59,130,246,0.08)] transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-[#2563EB] focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.10),0_1px_3px_rgba(59,130,246,0.08)] sm:max-w-[480px]">
      <span className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center">
        <SearchRefraction
          strokeWidth={1.8}
          className="h-[14px] w-[14px] text-[var(--pk-text-desc)]"
        />
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[14px] w-full bg-transparent text-sm font-normal text-[#1E3A5F] placeholder:text-sm placeholder:font-normal placeholder:text-[var(--pk-text-desc)] focus:outline-none"
      />
      {hasValue ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] hover:bg-[#BFDBFE] transition-colors duration-100"
        >
          <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
            <path d="M3.8 3.8L8.2 8.2M8.2 3.8L3.8 8.2" stroke="#1E3A5F" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </label>
  );
};

export const SortSegmentedControl = ({
  activeValue,
  onSuggested,
  onAlphabetical,
  disabled = false,
}: {
  activeValue: "suggested" | "az" | "az_category";
  onSuggested: () => void;
  onAlphabetical: () => void;
  disabled?: boolean;
}) => {
  const [visualValue, setVisualValue] = useState<"suggested" | "az" | "az_category">(activeValue);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisualValue(activeValue);
  }, [activeValue]);

  useEffect(() => () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
  }, []);

  const queueCommit = (commit: () => void) => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = setTimeout(() => {
      commit();
      commitTimerRef.current = null;
    }, 0);
  };

  const isVisualAlphabetical = visualValue === "az" || visualValue === "az_category";
  const isVisualSuggested = !isVisualAlphabetical;

  return (
    <div className={`relative inline-grid h-10 grid-cols-2 items-center rounded-[9px] border border-[#DBEAFE] bg-[var(--pk-brand-light)] p-[3px] transition-opacity duration-150 ${disabled ? "cursor-not-allowed opacity-40" : ""}`}>
      <span
        aria-hidden
        className={`pointer-events-none absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-[7px] bg-[#FFFFFF] shadow-[0_2px_8px_rgba(59,130,246,0.18)] transition-transform duration-200 ease-out ${
          isVisualAlphabetical ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <button
        type="button"
        onClick={disabled ? undefined : () => {
          setVisualValue("suggested");
          queueCommit(onSuggested);
        }}
        disabled={disabled}
        aria-pressed={isVisualSuggested}
        style={{ fontFamily: "'Space Grotesk', var(--pk-font-body)" }}
        className={`relative z-10 inline-flex h-full w-full items-center justify-center rounded-[7px] px-3 text-xs transition-colors duration-150 ease-out ${
          isVisualSuggested
            ? "font-semibold text-[#1E3A5F]"
            : "font-normal text-[#64748B]"
        }`}
      >
        Suggested
      </button>
      <button
        type="button"
        onClick={disabled ? undefined : () => {
          setVisualValue("az");
          queueCommit(onAlphabetical);
        }}
        disabled={disabled}
        aria-pressed={isVisualAlphabetical}
        style={{ fontFamily: "'Space Grotesk', var(--pk-font-body)" }}
        className={`relative z-10 inline-flex h-full w-full items-center justify-center rounded-[7px] px-3 text-xs transition-colors duration-150 ease-out ${
          isVisualAlphabetical
            ? "font-semibold text-[#1E3A5F]"
            : "font-normal text-[#64748B]"
        }`}
      >
        Alphabetical
      </button>
    </div>
  );
};
