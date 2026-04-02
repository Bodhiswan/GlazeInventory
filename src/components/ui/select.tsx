import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-12 w-full border border-border bg-transparent px-4 text-sm text-foreground outline-none transition-[border-color] focus:border-foreground/30",
        className,
      )}
      {...props}
    />
  );
}
