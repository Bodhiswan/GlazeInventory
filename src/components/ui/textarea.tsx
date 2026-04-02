import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-[border-color] placeholder:text-muted/60 focus:border-foreground/30",
        className,
      )}
      {...props}
    />
  );
}
