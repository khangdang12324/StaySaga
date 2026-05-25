"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import { deleteHostRegistration } from "@/core/host/actions";

type DeleteRegistrationButtonProps = {
  propertyId: string;
};

export function DeleteRegistrationButton({
  propertyId,
}: DeleteRegistrationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
      >
        <Trash2 className="h-4 w-4" />
        Xóa đăng ký
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-xl bg-white p-6 text-left shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <p className="pr-8 text-[17px] leading-7 text-slate-800">
                Quý vị có chắc muốn xóa đăng ký? Thao tác này sẽ xóa chỗ nghỉ
                và không thể hoàn tác.
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="border border-[#f60057] p-1.5 text-slate-700 hover:bg-rose-50"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={deleteHostRegistration} className="mt-8 flex gap-3">
              <input type="hidden" name="id" value={propertyId} />
              <input
                type="hidden"
                name="confirm_delete_registration"
                value="on"
              />
              <PendingSubmitButton
                className="rounded-sm bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004c]"
                pendingText="Đang xóa..."
              >
                Xóa đăng ký
              </PendingSubmitButton>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-sm border border-[#f60057] px-5 py-3 font-bold text-[#f60057] hover:bg-rose-50"
              >
                Hủy
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
