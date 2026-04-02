"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = ComponentProps<typeof Button> & {
  pendingText: string;
};

export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: Readonly<SubmitButtonProps>) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} disabled={disabled || pending} type="submit">
      {pending ? pendingText : children}
    </Button>
  );
}
