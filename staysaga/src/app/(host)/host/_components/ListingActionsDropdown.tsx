"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronDown, 
  Eye, 
  Edit3, 
  Calendar, 
  DollarSign, 
  PowerOff, 
  Play, 
  Trash2, 
  X,
  MessageSquare,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { 
  requestClosePropertyAction, 
  reopenPropertyAction, 
  requestDeletePropertyAction 
} from "@/core/host/actions";

type Props = {
  propertyId: string;
  status: string;
  isActive: boolean;
};

export function ListingActionsDropdown({ propertyId, status, isActive }: Props) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCloseProperty = () => {
    startTransition(async () => {
      const res = await requestClosePropertyAction(propertyId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Đã tạm đóng chỗ nghỉ thành công.");
        setCloseModalOpen(false);
        setDropdownOpen(false);
        router.refresh();
      }
    });
  };

  const handleReopenProperty = () => {
    startTransition(async () => {
      const res = await reopenPropertyAction(propertyId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Chỗ nghỉ đã được mở bán trở lại.");
        setDropdownOpen(false);
        router.refresh();
      }
    });
  };

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteReason.trim().length < 10) {
      toast.error("Vui lòng nhập lý do tối thiểu 10 ký tự.");
      return;
    }
    startTransition(async () => {
      const res = await requestDeletePropertyAction(propertyId, deleteReason);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Đã gửi yêu cầu xóa chỗ nghỉ.");
        setDeleteModalOpen(false);
        setDropdownOpen(false);
        setDeleteReason("");
        router.refresh();
      }
    });
  };

  const isDeleteRequested = status === "DELETE_REQUESTED";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
        ) : (
          <span>Thao tác</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1.5 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-left animate-in fade-in slide-in-from-top-1 duration-150">
          {/* VIEW */}
          <Link
            href={`/host/${propertyId}`}
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Eye className="h-4 w-4 text-slate-400" />
            <span>Xem chi tiết</span>
          </Link>

          {/* If DELETE_REQUESTED, only allow View and Contact Support */}
          {isDeleteRequested ? (
            <Link
              href="/help/contact"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-rose-500" />
              <span>Liên hệ hỗ trợ</span>
            </Link>
          ) : (
            <>
              {/* EDIT */}
              <Link
                href={`/host/properties/${propertyId}/edit`}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Edit3 className="h-4 w-4 text-slate-400" />
                <span>Chỉnh sửa thông tin</span>
              </Link>

              {/* RATE & ROOMS */}
              <Link
                href={`/host/${propertyId}/calendar/rate-plans`}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span>Quản lý phòng & giá</span>
              </Link>

              {/* CALENDAR */}
              <Link
                href={`/host/${propertyId}/calendar`}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Lịch mở bán</span>
              </Link>

              <hr className="my-1 border-slate-100" />

              {/* CLOSE / REOPEN */}
              {status === "APPROVED" && isActive ? (
                <button
                  onClick={() => {
                    setCloseModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <PowerOff className="h-4 w-4 text-amber-500" />
                  <span>Tạm đóng chỗ nghỉ</span>
                </button>
              ) : (status === "CLOSED_TEMP" || (status === "APPROVED" && !isActive)) ? (
                <button
                  onClick={handleReopenProperty}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <Play className="h-4 w-4 text-emerald-500" />
                  <span>Mở lại chỗ nghỉ</span>
                </button>
              ) : null}

              {/* DELETE REQUEST */}
              {status !== "DELETED" && status !== "SUSPENDED" && (
                <button
                  onClick={() => {
                    setDeleteModalOpen(true);
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Yêu cầu xóa</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL: CLOSE CONFIRMATION */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl rounded-xl text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tạm đóng chỗ nghỉ?</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Khách sẽ không thể đặt chỗ nghỉ này trong thời gian tạm đóng. Các đơn đặt phòng hiện có vẫn được giữ nguyên và bạn vẫn có trách nhiệm đón khách.
                </p>
              </div>
              <button
                onClick={() => setCloseModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setCloseModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleCloseProperty}
                disabled={isPending}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Tạm đóng chỗ nghỉ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE REQUEST */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl rounded-xl text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Yêu cầu xóa chỗ nghỉ?</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Yêu cầu này sẽ được gửi đến quản trị viên. Chỗ nghỉ sẽ bị ẩn khỏi tìm kiếm trong lúc chờ xử lý.
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeleteRequest} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Lý do yêu cầu xóa</span>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  required
                  minLength={10}
                  rows={3}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 transition-all font-medium"
                  placeholder="Nhập lý do chi tiết (tối thiểu 10 ký tự)..."
                />
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending || deleteReason.trim().length < 10}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Gửi yêu cầu xóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
