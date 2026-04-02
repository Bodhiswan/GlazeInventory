import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-border bg-panel-strong p-4 sm:p-5 lg:p-6",
        className,
      )}
      {...props}
    />
  );
}
