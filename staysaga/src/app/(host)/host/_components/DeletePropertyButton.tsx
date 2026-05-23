"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import { requestDeleteMyProperty } from "@/core/host/actions";

type DeletePropertyButtonProps = {
  propertyId: string;
  status: string;
};

export function DeletePropertyButton({
  propertyId,
  status,
}: DeletePropertyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (status === "DELETED") {
    return (
      <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
        Đã hủy
      </span>
    );
  }

  if (status === "DELETE_REQUESTED") {
    return (
      <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Chờ duyệt hủy
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-[4px] border border-red-600 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition"
      >
        Hủy phòng
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg border border-slate-200 bg-white p-6 shadow-2xl rounded-md text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Yêu cầu hủy chỗ nghỉ / phòng</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Quản trị viên sẽ xem xét các đơn đặt phòng hiện có trước khi xác nhận hủy chỗ nghỉ này.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 transition"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={requestDeleteMyProperty} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={propertyId} />
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Lý do muốn hủy chỗ nghỉ</span>
                <textarea
                  name="reason"
                  required
                  minLength={10}
                  rows={4}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-100"
                  placeholder="Nhập lý do chi tiết (tối thiểu 10 ký tự)..."
                />
              </label>
              <label className="flex gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input name="confirm_delete_request" type="checkbox" required className="mt-1 h-4 w-4 accent-red-600" />
                <span>Tôi xác nhận muốn gửi yêu cầu hủy và hiểu rằng quyết định này cần được quản trị viên duyệt.</span>
              </label>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-[4px] border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Đóng
                </button>
                <PendingSubmitButton 
                  className="rounded-[4px] bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-bold text-white transition shadow-sm" 
                  pendingText="Đang gửi..."
                >
                  Gửi yêu cầu
                </PendingSubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
