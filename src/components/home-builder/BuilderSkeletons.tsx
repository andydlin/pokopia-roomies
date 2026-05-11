export const BuilderResultsListSkeleton = () => (
  <section className="space-y-4">
    <div className="mb-4 flex flex-col gap-2">
      <div className="pk-skeleton h-4 w-[180px] rounded-[4px]" />
      <div className="pk-skeleton h-[11px] w-[320px] max-w-full rounded-[4px]" />
    </div>
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((cardIndex) => (
        <div
          key={`list-skeleton-card-${cardIndex}`}
          className="flex gap-3 rounded-[14px] border border-[#DBEAFE] bg-white p-[14px]"
        >
          <div className="pk-skeleton h-[56px] w-[56px] rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="pk-skeleton h-[13px] w-[55%] rounded-[4px]" />
            <div className="pk-skeleton h-[10px] w-[35%] rounded-[4px]" />
            <div className="mt-[2px] flex gap-1.5">
              <div className="pk-skeleton h-5 w-16 rounded-[999px]" />
              <div className="pk-skeleton h-5 w-[52px] rounded-[999px]" />
              <div className="pk-skeleton h-5 w-[72px] rounded-[999px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const BuilderResultsSkeleton = () => (
  <div className="space-y-4" data-testid="builder-results-skeleton">
    <div className="flex flex-wrap items-center gap-2">
      <div className="pk-skeleton h-12 w-full max-w-[480px] rounded-[12px]" />
      <div className="pk-skeleton h-12 w-[168px] rounded-[12px]" />
    </div>
    <BuilderResultsListSkeleton />
  </div>
);

export const BuilderSidebarSkeleton = () => (
  <div className="space-y-5" data-testid="builder-sidebar-skeleton">
    <section className="space-y-2">
      <div className="pk-skeleton h-4 w-[160px] rounded-[4px]" />
      <div className="space-y-1.5">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={`sidebar-skeleton-row-${row}`}
            className="flex items-center gap-[10px] rounded-[10px] px-3 py-2.5"
          >
            <div className="pk-skeleton h-9 w-9 rounded-[8px]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="pk-skeleton h-3 w-[60%] rounded-[4px]" />
              <div className="pk-skeleton h-[10px] w-[40%] rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    </section>
    <section className="space-y-3">
      {[0, 1].map((groupIndex) => (
        <div key={`sidebar-skeleton-coverage-${groupIndex}`} className="space-y-2">
          <div className="pk-skeleton mb-2 h-[10px] w-20 rounded-[4px]" />
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2].map((chip) => (
              <div key={`sidebar-skeleton-coverage-chip-${groupIndex}-${chip}`} className="pk-skeleton h-[22px] w-[70px] rounded-[999px]" />
            ))}
          </div>
        </div>
      ))}
    </section>
  </div>
);
