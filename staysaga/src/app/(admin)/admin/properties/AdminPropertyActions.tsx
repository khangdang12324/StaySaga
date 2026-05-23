"use client";

import { useState } from "react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import {
  approveDeleteProperty,
  approveProperty,
  hideProperty,
  rejectDeleteProperty,
  rejectProperty,
  reopenProperty,
  suspendProperty,
  updatePropertyStatus,
} from "@/core/admin/actions";
import type { PropertyStatus } from "@/core/properties/status";

type AdminPropertyActionsProps = {
  propertyId: string;
  status: PropertyStatus;
  deleteReason?: string | null;
  rejectionReason?: string | null;
};

const primary = "bg-[#f60057] px-3 py-2 text-sm font-bold text-white hover:bg-[#d9004e]";
const outline = "border border-[#f60057] px-3 py-2 text-sm font-bold text-[#f60057] hover:bg-rose-50";
const danger = "border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-bold text-[#f60057] hover:bg-rose-100";

export function AdminPropertyActions({
  propertyId,
  status,
  deleteReason,
  rejectionReason,
}: AdminPropertyActionsProps) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [showDeleteRejectReason, setShowDeleteRejectReason] = useState(false);

  if (status === "DELETED") {
    return <span className="text-sm font-bold text-slate-500">Chỉ xem</span>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {(status === "DRAFT" || status === "PENDING") && (
        <>
          <form action={approveProperty}>
            <input type="hidden" name="id" value={propertyId} />
            <PendingSubmitButton className={primary} pendingText="Đang duyệt...">
              Duyệt
            </PendingSubmitButton>
          </form>
          {showRejectReason ? (
            <form action={rejectProperty} className="flex w-full gap-2">
              <input type="hidden" name="id" value={propertyId} />
              <input
                name="reason"
                required
                minLength={3}
                placeholder="Lý do từ chối"
                className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f60057] text-slate-950 bg-white"
              />
              <PendingSubmitButton className={danger} pendingText="Đang gửi...">
                Gửi
              </PendingSubmitButton>
            </form>
          ) : (
            <button type="button" onClick={() => setShowRejectReason(true)} className={danger}>
              Từ chối
            </button>
          )}
        </>
      )}

      {status === "REJECTED" && rejectionReason && (
        <details className="w-full rounded border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs text-rose-900">
          <summary className="cursor-pointer font-bold">Lý do từ chối</summary>
          <p className="mt-2 whitespace-pre-wrap">{rejectionReason}</p>
        </details>
      )}

      {status === "APPROVED" && (
        <>
          <form action={hideProperty}>
            <input type="hidden" name="id" value={propertyId} />
            <PendingSubmitButton className={outline} pendingText="Đang ẩn..." confirmMessage="Ẩn chỗ nghỉ này khỏi public?">
              Ẩn
            </PendingSubmitButton>
          </form>
          <StatusForm propertyId={propertyId} status="CLOSED_TEMP" label="Tạm đóng" className={outline} />
          <SuspendForm propertyId={propertyId} />
        </>
      )}

      {(status === "HIDDEN" || status === "CLOSED_TEMP" || status === "SUSPENDED" || status === "REJECTED") && (
        <>
          <form action={reopenProperty}>
            <input type="hidden" name="id" value={propertyId} />
            <PendingSubmitButton className={primary} pendingText="Đang mở lại...">
              Mở lại
            </PendingSubmitButton>
          </form>
          {status !== "SUSPENDED" && <SuspendForm propertyId={propertyId} />}
        </>
      )}

      {status === "DELETE_REQUESTED" && (
        <>
          {deleteReason && (
            <details className="w-full rounded border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-900">
              <summary className="cursor-pointer font-bold">Xem lý do</summary>
              <p className="mt-2 whitespace-pre-wrap">{deleteReason}</p>
            </details>
          )}
          <form action={approveDeleteProperty}>
            <input type="hidden" name="id" value={propertyId} />
            <PendingSubmitButton
              className={danger}
              pendingText="Đang duyệt xóa..."
              confirmMessage="Duyệt xóa mềm chỗ nghỉ này? Nếu còn booking đang hoạt động, hệ thống sẽ chặn."
            >
              Duyệt xóa
            </PendingSubmitButton>
          </form>
          {showDeleteRejectReason ? (
            <form action={rejectDeleteProperty} className="flex w-full gap-2">
              <input type="hidden" name="id" value={propertyId} />
              <input
                name="reason"
                required
                placeholder="Lý do từ chối"
                className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#f60057] text-slate-950 bg-white"
              />
              <PendingSubmitButton className={outline} pendingText="Đang gửi...">
                Gửi
              </PendingSubmitButton>
            </form>
          ) : (
            <button type="button" onClick={() => setShowDeleteRejectReason(true)} className={outline}>
              Từ chối xóa
            </button>
          )}
        </>
      )}
    </div>
  );
}

function StatusForm({
  propertyId,
  status,
  label,
  className,
  confirmMessage,
}: {
  propertyId: string;
  status: PropertyStatus;
  label: string;
  className: string;
  confirmMessage?: string;
}) {
  return (
    <form action={updatePropertyStatus}>
      <input type="hidden" name="id" value={propertyId} />
      <input type="hidden" name="status" value={status} />
      <PendingSubmitButton className={className} pendingText="Đang xử lý..." confirmMessage={confirmMessage}>
        {label}
      </PendingSubmitButton>
    </form>
  );
}

function SuspendForm({ propertyId }: { propertyId: string }) {
  return (
    <form action={suspendProperty} className="flex gap-2">
      <input type="hidden" name="id" value={propertyId} />
      <input type="hidden" name="reason" value="Quản trị viên khóa chỗ nghỉ từ trang quản lý." />
      <PendingSubmitButton
        className={danger}
        pendingText="Đang khóa..."
        confirmMessage="Khóa chỗ nghỉ này? Đối tác sẽ không thể tự mở lại."
      >
        Khóa
      </PendingSubmitButton>
    </form>
  );
}
