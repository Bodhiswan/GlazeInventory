export default function InventoryLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3 border-b border-border pb-5 sm:pb-6">
        <div className="h-3 w-20 rounded bg-muted/30" />
        <div className="h-10 w-48 rounded bg-muted/30" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border border-border bg-panel px-4 py-4">
            <div className="h-10 w-10 rounded bg-muted/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-muted/20" />
              <div className="h-3 w-24 rounded bg-muted/20" />
            </div>
            <div className="h-6 w-16 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
