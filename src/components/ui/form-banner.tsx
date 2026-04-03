import { cn } from "@/lib/utils";

type FormBannerVariant = "error" | "success" | "info";

const variantStyles: Record<FormBannerVariant, string> = {
  error: "border-[#bb6742]/18 bg-[#bb6742]/10 text-[#7f4026]",
  success: "border-accent-3/20 bg-accent-3/10 text-accent-3",
  info: "border-foreground/12 bg-foreground/5 text-foreground/80",
};

export function FormBanner({
  variant,
  children,
  className,
}: {
  variant: FormBannerVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border px-4 py-3 text-sm", variantStyles[variant], className)}>
      {children}
    </div>
  );
}
