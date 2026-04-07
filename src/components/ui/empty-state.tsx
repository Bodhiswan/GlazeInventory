import type { ReactNode } from "react";

import { Panel } from "@/components/ui/panel";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Panel>
      <h2 className="display-font text-3xl tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Panel>
  );
}
