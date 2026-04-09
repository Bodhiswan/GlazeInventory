export function GlazeUserStateSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-40 rounded bg-muted/30" />
      <div className="h-10 w-full rounded bg-muted/20" />
      <div className="space-y-3 pt-4">
        <div className="h-4 w-24 rounded bg-muted/20" />
        <div className="h-16 w-full rounded bg-muted/20" />
      </div>
    </div>
  );
}
