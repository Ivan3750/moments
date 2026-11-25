export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[470px] space-y-6 px-3 pt-4 md:px-0 md:pt-8" aria-busy aria-label="Loading">
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex w-[68px] shrink-0 flex-col items-center gap-2">
            <div className="skeleton size-16 rounded-full" />
            <div className="skeleton h-2.5 w-12 rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton size-9 rounded-full" />
            <div className="skeleton h-3 w-28 rounded" />
          </div>
          <div className="skeleton aspect-[4/5] w-full rounded-sm" />
          <div className="skeleton h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}
