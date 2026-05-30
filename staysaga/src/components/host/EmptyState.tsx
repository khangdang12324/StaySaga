import Link from "next/link";
import { AlertCircle, HelpCircle, ArrowLeft } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  isDeveloping?: boolean;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Hiện tại không có thông tin nào để hiển thị trong mục này.",
  isDeveloping = false,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  const displayTitle = isDeveloping ? "Tính năng đang phát triển" : title;
  const displayDescription = isDeveloping
    ? "Chúng tôi đang hoàn thiện tính năng này. Vui lòng quay lại sau."
    : description;

  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-slate-350 bg-white px-8 py-16 text-center rounded-xl shadow-sm">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#f60057]">
        {isDeveloping ? (
          <HelpCircle className="h-8 w-8" />
        ) : (
          <AlertCircle className="h-8 w-8" />
        )}
      </div>

      <h3 className="text-[19px] font-black text-slate-900 leading-tight">
        {displayTitle}
      </h3>
      <p className="mt-3 text-[14px] text-slate-650 max-w-sm leading-relaxed">
        {displayDescription}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#f60057] px-6 text-sm font-bold text-white shadow-md shadow-rose-900/10 hover:bg-[#d9004c] hover:shadow-lg transition-all"
          >
            {actionLabel}
          </Link>
        ) : (
          <Link
            href="/host"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ Host
          </Link>
        )}
      </div>
    </div>
  );
}
