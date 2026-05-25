"use client";

import { useTransition } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Building, CheckCircle, Loader2, UserRound } from "lucide-react";
import { updateUserStatus } from "@/core/admin/actions";

type AdminPartnerActionsProps = {
  partnerId: string;
  partnerName: string;
  status: string;
};

export function AdminPartnerActions({ partnerId, partnerName, status }: AdminPartnerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isBlocked = status === "BLOCKED";

  const handleStatusChange = (newStatus: "ACTIVE" | "BLOCKED") => {
    const action = newStatus === "BLOCKED" ? "khóa" : "mở khóa";
    const confirmed = window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản "${partnerName}"?`);
    if (!confirmed) return;

    const loadingToastId = toast.loading("Đang cập nhật tài khoản...");
    const formData = new FormData();
    formData.set("id", partnerId);
    formData.set("status", newStatus);

    startTransition(async () => {
      try {
        await updateUserStatus(formData);
        toast.success(`Đã ${action} tài khoản.`, { id: loadingToastId });
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("NEXT_REDIRECT")) {
          toast.success(`Đã ${action} tài khoản.`, { id: loadingToastId });
          router.refresh();
          return;
        }

        toast.error("Không thể cập nhật trạng thái tài khoản.", { id: loadingToastId });
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
      <Link
        href={`/admin/properties?ownerId=${partnerId}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Building className="h-3.5 w-3.5" />
        Xem chỗ nghỉ
      </Link>

      <Link
        href={`/admin/users?userId=${partnerId}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <UserRound className="h-3.5 w-3.5" />
        Xem tài khoản
      </Link>

      <button
        type="button"
        onClick={() => handleStatusChange(isBlocked ? "ACTIVE" : "BLOCKED")}
        disabled={isPending}
        className={
          isBlocked
            ? "inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        }
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isBlocked ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Ban className="h-3.5 w-3.5" />
        )}
        {isBlocked ? "Mở khóa" : "Khóa"}
      </button>
    </div>
  );
}
