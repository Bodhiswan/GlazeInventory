/** Inline citation marker — renders as a small superscript reference */
export function Cite({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <sup className="ml-0.5">
      <a
        href={`#ref-${id}`}
        className="text-[10px] text-accent-2 no-underline hover:underline"
        title={String(children)}
      >
        [{id}]
      </a>
    </sup>
  );
}

/** Reference list entry for the bibliography at the bottom of a guide page */
export function Reference({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <li id={`ref-${id}`} className="text-[13px] leading-6 text-muted">
      <span className="font-medium text-foreground">[{id}]</span>{" "}
      {children}
    </li>
  );
}

/** Bibliography wrapper */
export function Bibliography({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="display-font text-xl tracking-tight">References</h2>
      <ol className="mt-4 list-none space-y-2 pl-0">{children}</ol>
    </section>
  );
}
