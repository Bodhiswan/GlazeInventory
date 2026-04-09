export function GuideSection({
  id,
  title,
  level = 2,
  children,
}: {
  id: string;
  title: string;
  level?: 2 | 3;
  children: React.ReactNode;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  const styles =
    level === 2
      ? "display-font mt-2 text-[clamp(1.5rem,4vw,2.2rem)] leading-[1.05] tracking-[-0.02em]"
      : "display-font mt-1 text-[clamp(1.15rem,3vw,1.5rem)] leading-[1.1] tracking-[-0.01em]";

  return (
    <section id={id} className="scroll-mt-24">
      <Tag className={styles}>{title}</Tag>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
        {children}
      </div>
    </section>
  );
}
