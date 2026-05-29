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
    <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 bg-white px-6 py-16 text-center rounded-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-[#f60057]">
        {isDeveloping ? (
          <HelpCircle className="h-7 w-7" />
        ) : (
          <AlertCircle className="h-7 w-7" />
        )}
      </div>

      <h3 className="text-[17px] font-bold text-slate-800">
        {displayTitle}
      </h3>
      <p className="mt-2 text-sm text-slate-600 max-w-sm">
        {displayDescription}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded bg-[#f60057] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#d9004c] transition"
          >
            {actionLabel}
          </Link>
        ) : (
          <Link
            href="/host"
            className="inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ Host
          </Link>
        )}
      </div>
    </div>
  );
}
