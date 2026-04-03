export default function CombinationsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3 border-b border-border pb-5 sm:pb-6">
        <div className="h-3 w-28 rounded bg-muted/30" />
        <div className="h-10 w-64 rounded bg-muted/30" />
      </div>
      <div className="space-y-4 border border-border bg-panel p-4 sm:p-5">
        <div className="h-11 w-full rounded bg-muted/20" />
        <div className="flex gap-2">
          <div className="h-8 w-36 rounded bg-muted/20" />
          <div className="h-8 w-44 rounded bg-muted/20" />
        </div>
      </div>
    </div>
  );
}
