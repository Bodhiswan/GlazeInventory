export default function GlazesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3 border-b border-border pb-5 sm:pb-6">
        <div className="h-3 w-20 rounded bg-muted/30" />
        <div className="h-10 w-64 rounded bg-muted/30" />
      </div>
      <div className="space-y-4 border border-border bg-panel p-4 sm:p-5">
        <div className="h-11 w-full rounded bg-muted/20" />
        <div className="h-10 w-32 rounded bg-muted/20" />
        <div className="h-4 w-24 rounded bg-muted/20" />
      </div>
    </div>
  );
}
