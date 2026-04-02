import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full border border-border bg-transparent px-4 text-sm text-foreground transition-[border-color] placeholder:text-muted/60 focus-visible:border-foreground/30 focus-visible:outline-none sm:h-12",
        className,
      )}
      {...props}
    />
  );
}
