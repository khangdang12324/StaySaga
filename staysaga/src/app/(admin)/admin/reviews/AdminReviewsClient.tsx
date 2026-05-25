"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Pagination } from "@/components/ui/Pagination";
import { updateReviewStatus } from "@/core/admin/actions";
import { Star, Search, EyeOff, Eye, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  status: string | null;
  created_at: string;
  user: { full_name: string | null; email: string | null } | null;
  homestay: { name: string | null; city: string | null } | null;
};

type Props = {
  initialReviews: ReviewRow[];
  prefilledRatingFilter?: string; // e.g. "low" from dashboard query param
};

export function AdminReviewsClient({ initialReviews, prefilledRatingFilter }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(prefilledRatingFilter || "");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [q, statusFilter, ratingFilter]);

  // Helper to generate stars
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
      />
    ));
  };

  // Filter list
  const filteredReviews = initialReviews.filter((review) => {
    // Search comment, user name or property name
    if (q) {
      const qLower = q.toLowerCase();
      const commentText = (review.comment || "").toLowerCase();
      const userName = (review.user?.full_name || "").toLowerCase();
      const homestayName = (review.homestay?.name || "").toLowerCase();
      if (!commentText.includes(qLower) && !userName.includes(qLower) && !homestayName.includes(qLower)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter && review.status !== statusFilter) return false;

    // Rating filter (low = <= 3 stars)
    if (ratingFilter) {
      if (ratingFilter === "low" && review.rating > 3) return false;
      if (ratingFilter !== "low" && review.rating !== Number(ratingFilter)) return false;
    }

    return true;
  });

  const toggleVisibility = (reviewId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "HIDDEN" ? "VISIBLE" : "HIDDEN";
    const confirmMsg = newStatus === "HIDDEN"
      ? "Bạn có chắc chắn muốn ẨN đánh giá này khỏi trang chỗ nghỉ công khai?"
      : "Bạn có chắc chắn muốn HIỂN THỊ lại đánh giá này?";

    if (!window.confirm(confirmMsg)) return;

    const loadingToastId = toast.loading("Đang xử lý...");

    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", reviewId);
      fd.set("status", newStatus);

      try {
        await updateReviewStatus(fd);
        toast.success(newStatus === "HIDDEN" ? "Đã ẩn đánh giá thành công." : "Đã hiển thị lại đánh giá thành công.", { id: loadingToastId });
        router.refresh();
      } catch (err) {
        console.error("Lỗi thay đổi hiển thị review:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("NEXT_REDIRECT")) {
          toast.success(newStatus === "HIDDEN" ? "Đã ẩn đánh giá thành công." : "Đã hiển thị lại đánh giá thành công.", { id: loadingToastId });
          router.refresh();
        } else {
          toast.error("Thao tác thất bại.", { id: loadingToastId });
        }
      }
    });
  };

  return (
    <div>
      {/* Filters form */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 items-end mb-6">
        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">Tìm kiếm nội dung</span>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:border-rose-500"
              placeholder="Tìm nội dung, người đánh giá, chỗ nghỉ..."
            />
          </div>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">Kiểm duyệt (Status)</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="VISIBLE">Đang hiển thị (VISIBLE)</option>
            <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
          </select>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">Xếp hạng đánh giá (Rating)</span>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Tất cả điểm số</option>
            <option value="low">Đánh giá tiêu cực (≤ 3 sao)</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
            <option value="4">⭐⭐⭐⭐ (4 sao)</option>
            <option value="3">⭐⭐⭐ (3 sao)</option>
            <option value="2">⭐⭐ (2 sao)</option>
            <option value="1">⭐ (1 sao)</option>
          </select>
        </div>

        <div className="md:col-span-3 flex justify-end gap-2">
          <button
            onClick={() => { setQ(""); setStatusFilter(""); setRatingFilter(""); }}
            className="rounded-lg border px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {/* Reviews list table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Đánh giá</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Chỗ nghỉ</th>
                <th className="px-6 py-4">Ngày viết</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Kiểm duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              ) : (
                filteredReviews
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50/50 transition-colors align-middle">
                      <td className="px-6 py-4 max-w-[320px]">
                        <div className="flex items-center gap-1 mb-1.5">{renderStars(review.rating)}</div>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed line-clamp-3">
                          &ldquo;{review.comment || "Không có nhận xét bằng văn bản."}&rdquo;
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {review.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs leading-snug">
                          {review.user?.full_name || "Khách Vãng Lai"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{review.user?.email || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs leading-snug">{review.homestay?.name || "Chỗ nghỉ bị xóa"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{review.homestay?.city || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        {new Date(review.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border ${
                            review.status === "HIDDEN"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {review.status === "HIDDEN" ? "ĐÃ ẨN" : "HIỂN THỊ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {review.status === "HIDDEN" ? (
                          <button
                            onClick={() => toggleVisibility(review.id, "HIDDEN")}
                            disabled={isPending}
                            className="rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 text-xs font-bold transition-colors inline-flex items-center gap-1.5 ml-auto disabled:opacity-50"
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                            Hiện lại
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleVisibility(review.id, "VISIBLE")}
                            disabled={isPending}
                            className="rounded-lg bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 text-xs font-bold transition-colors inline-flex items-center gap-1.5 ml-auto disabled:opacity-50"
                          >
                            {isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                            Ẩn đánh giá
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredReviews.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={filteredReviews.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
