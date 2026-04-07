export function CombinationsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="border border-border bg-panel p-4">
        <div className="h-10 w-full rounded bg-muted/20" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border border-border bg-panel p-4">
            <div className="h-48 w-full rounded bg-muted/20" />
            <div className="mt-3 h-4 w-3/4 rounded bg-muted/30" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
