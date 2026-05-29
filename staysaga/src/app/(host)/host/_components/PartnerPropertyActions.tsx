"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import {
  closeMyPropertyTemporarily,
  reopenMyProperty,
  requestDeleteMyProperty,
  submitPropertyForReview,
} from "@/core/host/actions";
import type { PropertyStatus } from "@/core/properties/status";

type PartnerPropertyActionsProps = {
  propertyId: string;
  status: PropertyStatus;
  isActive: boolean;
  compact?: boolean;
};

const outline =
  "inline-flex items-center justify-center border border-[#f60057] px-4 py-2 text-sm font-bold text-[#f60057] hover:bg-rose-50";
const primary =
  "inline-flex items-center justify-center bg-[#f60057] px-4 py-2 text-sm font-bold text-white hover:bg-[#d9004e]";

export function PartnerPropertyActions({
  propertyId,
  status,
  isActive,
  compact = false,
}: PartnerPropertyActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (status === "DELETED") {
    return <span className="text-sm font-bold text-slate-500">Đã xóa mềm</span>;
  }

  if (status === "DELETE_REQUESTED") {
    return (
      <span className="rounded bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
        Đang chờ quản trị viên xử lý yêu cầu xóa
      </span>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <span className="rounded bg-rose-100 px-3 py-1 text-sm font-bold text-[#f60057]">
        Chỗ nghỉ đã bị khóa bởi quản trị viên
      </span>
    );
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-3"}>
      {(status === "DRAFT" || status === "REJECTED") && (
        <form action={submitPropertyForReview}>
          <input type="hidden" name="id" value={propertyId} />
          <PendingSubmitButton className={primary} pendingText="Đang gửi duyệt...">
            Gửi duyệt
          </PendingSubmitButton>
        </form>
      )}

      {status === "PENDING" && (
        <span className="rounded bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
          Đang chờ duyệt
        </span>
      )}

      {status === "APPROVED" && isActive ? (
        <form action={closeMyPropertyTemporarily}>
          <input type="hidden" name="id" value={propertyId} />
          <PendingSubmitButton
            className={outline}
            pendingText="Đang tạm đóng..."
            confirmMessage="Tạm đóng chỗ nghỉ này? Chỗ nghỉ sẽ không còn hiển thị public nhưng booking hiện có vẫn giữ nguyên."
          >
            Tạm đóng chỗ nghỉ
          </PendingSubmitButton>
        </form>
      ) : status === "CLOSED_TEMP" || (status === "APPROVED" && !isActive) ? (
        <form action={reopenMyProperty}>
          <input type="hidden" name="id" value={propertyId} />
          <PendingSubmitButton className={outline} pendingText="Đang mở lại...">
            {status === "APPROVED" ? "Mở bán chỗ nghỉ" : "Mở lại chỗ nghỉ"}
          </PendingSubmitButton>
        </form>
      ) : null}

      {status !== "PENDING" && (
        <button type="button" onClick={() => setDeleteOpen(true)} className={primary}>
          Yêu cầu xóa chỗ nghỉ
        </button>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Yêu cầu xóa chỗ nghỉ</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Quản trị viên sẽ kiểm tra booking đang hoạt động trước khi duyệt xóa mềm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-950"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={requestDeleteMyProperty} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={propertyId} />
              <label className="block">
                <span className="mb-2 block font-bold">Lý do muốn xóa chỗ nghỉ</span>
                <textarea
                  name="reason"
                  required
                  minLength={10}
                  rows={4}
                  className="w-full border border-slate-300 px-3 py-2 outline-none focus:border-[#f60057] focus:ring-2 focus:ring-rose-100"
                  placeholder="Ví dụ: Tôi không còn kinh doanh chỗ nghỉ này."
                />
              </label>
              <label className="flex gap-3 text-sm font-semibold text-slate-700">
                <input name="confirm_delete_request" type="checkbox" required className="mt-1 h-4 w-4 accent-[#f60057]" />
                <span>Tôi hiểu rằng chỗ nghỉ sẽ không còn hiển thị sau khi yêu cầu được duyệt.</span>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="border border-slate-300 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <PendingSubmitButton className={primary} pendingText="Đang gửi...">
                  Gửi yêu cầu xóa
                </PendingSubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
