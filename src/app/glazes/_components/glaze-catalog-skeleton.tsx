export function GlazeCatalogSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-4 border border-border bg-panel p-4 sm:p-5">
        <div className="h-11 w-full rounded bg-muted/20" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded bg-muted/20" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="border border-border bg-panel p-4">
            <div className="h-40 w-full rounded bg-muted/20" />
            <div className="mt-3 h-4 w-3/4 rounded bg-muted/30" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
