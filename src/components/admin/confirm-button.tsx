"use client";

import type { ButtonHTMLAttributes } from "react";

/** A submit button that asks before running a destructive form action. */
export function ConfirmButton({
  message,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      {...props}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    />
  );
}
