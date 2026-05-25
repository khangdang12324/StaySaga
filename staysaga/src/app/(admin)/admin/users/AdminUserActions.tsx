"use client";

import { useTransition } from "react";
import { toast } from "react-hot-toast";
import { updateUserRole, updateUserStatus } from "@/core/admin/actions";
import type { AppRole, ProfileStatus } from "@/lib/auth/roles";
import { Shield, Ban, CheckCircle, Loader2 } from "lucide-react";

type AdminUserActionsProps = {
  userId: string;
  currentRole: AppRole;
  currentStatus: ProfileStatus;
  userName: string;
  isSelf: boolean;
};

export function AdminUserActions({
  userId,
  currentRole,
  currentStatus,
  userName,
  isSelf,
}: AdminUserActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = async (newRole: AppRole) => {
    if (newRole === currentRole) return;
    
    const confirmChange = window.confirm(
      `Bạn có chắc chắn muốn thay đổi vai trò của "${userName}" từ ${currentRole} thành ${newRole}?`
    );
    if (!confirmChange) return;

    const loadingToastId = toast.loading("Đang cập nhật vai trò...");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", userId);
      formData.set("role", newRole);
      
      try {
        await updateUserRole(formData);
        toast.success(`Đã cập nhật vai trò của "${userName}" sang ${newRole}.`, { id: loadingToastId });
      } catch (err) {
        console.error("Lỗi cập nhật vai trò:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("NEXT_REDIRECT")) {
          toast.success(`Đã cập nhật vai trò của "${userName}" sang ${newRole}.`, { id: loadingToastId });
        } else {
          toast.error("Lưu vai trò thất bại.", { id: loadingToastId });
        }
      }
    });
  };

  const handleStatusChange = async (newStatus: ProfileStatus) => {
    if (newStatus === currentStatus) return;

    let confirmMsg = `Bạn có chắc muốn khóa tài khoản của "${userName}"? Người dùng này sẽ không thể đăng nhập hoặc sử dụng dịch vụ.`;
    if (newStatus === "ACTIVE") {
      confirmMsg = `Bạn có chắc muốn mở khóa tài khoản của "${userName}"?`;
    }

    const confirmChange = window.confirm(confirmMsg);
    if (!confirmChange) return;

    const loadingToastId = toast.loading("Đang cập nhật trạng thái...");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", userId);
      formData.set("status", newStatus);
      
      try {
        await updateUserStatus(formData);
        toast.success(newStatus === "BLOCKED" ? `Đã khóa tài khoản "${userName}".` : `Đã mở khóa tài khoản "${userName}".`, { id: loadingToastId });
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("NEXT_REDIRECT")) {
          toast.success(newStatus === "BLOCKED" ? `Đã khóa tài khoản "${userName}".` : `Đã mở khóa tài khoản "${userName}".`, { id: loadingToastId });
        } else {
          toast.error("Cập nhật trạng thái thất bại.", { id: loadingToastId });
        }
      }
    });
  };

  if (isSelf) {
    return (
      <div className="text-right text-xs font-bold text-slate-400 italic px-4">
        Tài khoản đang đăng nhập
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {/* Role Selector */}
      <div className="relative flex items-center">
        <Shield className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        <select
          value={currentRole}
          disabled={isPending}
          onChange={(e) => handleRoleChange(e.target.value as AppRole)}
          className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <option value="USER">USER</option>
          <option value="PARTNER">PARTNER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Status Toggle Button */}
      {currentStatus === "ACTIVE" ? (
        <button
          onClick={() => handleStatusChange("BLOCKED")}
          disabled={isPending}
          className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Ban className="h-3.5 w-3.5" />
          )}
          Khóa
        </button>
      ) : (
        <button
          onClick={() => handleStatusChange("ACTIVE")}
          disabled={isPending}
          className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          Mở khóa
        </button>
      )}
    </div>
  );
}
