import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground !text-white [color:#fff] hover:bg-foreground/85 focus-visible:ring-foreground/20",
  secondary:
    "bg-transparent !text-foreground [color:var(--foreground)] border border-foreground hover:bg-foreground hover:!text-white hover:[color:#fff] focus-visible:ring-foreground/20",
  ghost:
    "bg-transparent !text-foreground [color:var(--foreground)] border border-border hover:border-foreground/30 hover:bg-foreground/[0.03] focus-visible:ring-foreground/10",
  danger:
    "bg-[#7f2d22] !text-white [color:#fff] hover:bg-[#682117] focus-visible:ring-[#7f2d22]/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 px-5 text-[11px] tracking-[0.14em]",
  md: "h-11 px-6 text-[11px] tracking-[0.14em]",
  lg: "h-12 px-7 text-[12px] tracking-[0.16em]",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center font-medium uppercase [touch-action:manipulation] transition-[background-color,color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />;
}
