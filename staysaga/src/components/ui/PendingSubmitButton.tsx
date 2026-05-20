"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type PendingSubmitButtonProps = {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  confirmMessage?: string;
  disabled?: boolean;
};

export function PendingSubmitButton({
  children,
  pendingText = "Đang xử lý...",
  className = "",
  confirmMessage,
  disabled = false,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }

        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
