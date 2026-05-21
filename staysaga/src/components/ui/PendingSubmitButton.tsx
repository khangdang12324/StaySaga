"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, X } from "lucide-react";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const isDisabled = pending || disabled;

  return (
    <>
      <button
        type={confirmMessage ? "button" : "submit"}
        disabled={isDisabled}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          if (confirmMessage) {
            event.preventDefault();
            setShowConfirm(true);
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

      {showConfirm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-[520px] rounded-lg bg-white p-6 text-gray-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[#f60057]">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Gửi chỗ nghỉ để duyệt</h2>
                  <p className="mt-3 leading-6 text-gray-700">
                    {confirmMessage}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    Sau khi được duyệt, chỗ nghỉ sẽ có thể mở bán và nhận đặt
                    phòng.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-sm p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-sm border border-[#f60057] px-6 font-bold text-[#f60057] hover:bg-rose-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-12 rounded-sm bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c]"
              >
                Gửi duyệt
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
