import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { updateReviewStatus } from "@/core/admin/actions";
import { Star } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminReviewsPage() {
  await requireAdmin();
  const supabaseAdmin = await createAdminClient();
  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, comment, status, created_at, user:profiles(full_name, email), homestay:homestays(name, city)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminShell
      title="Quản lý Đánh giá (Reviews)"
      description="Giám sát chất lượng dịch vụ. ADMIN có thể ẩn review vi phạm hoặc độc hại bằng trạng thái HIDDEN."
      activePath="/admin/reviews"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mt-6">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Đánh giá</th>
              <th className="px-6 py-4 font-bold">Người viết</th>
              <th className="px-6 py-4 font-bold">Chỗ nghỉ</th>
              <th className="px-6 py-4 font-bold text-right">Kiểm duyệt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(!reviews || reviews.length === 0) ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                  Chưa có đánh giá nào.
                </td>
              </tr>
            ) : reviews.map((review) => {
              const user = Array.isArray(review.user) ? review.user[0] : review.user;
              const homestay = Array.isArray(review.homestay)
                ? review.homestay[0]
                : review.homestay;
              
              // Helper to generate stars
              const stars = Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                />
              ));

              return (
                <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 max-w-[300px]">
                    <div className="flex items-center gap-1 mb-1.5">{stars}</div>
                    <p className="line-clamp-2 text-slate-700 italic">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {user?.full_name || user?.email || "Khách Vãng Lai"}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{homestay?.name || "Chỗ nghỉ bị xóa"}</p>
                    <p className="text-xs text-slate-500">{homestay?.city || "-"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <form action={updateReviewStatus} className="flex justify-end gap-2">
                      <input type="hidden" name="id" value={review.id} />
                      <select
                        name="status"
                        defaultValue={review.status || "VISIBLE"}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 ${
                          review.status === 'HIDDEN' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="VISIBLE">HIỂN THỊ (VISIBLE)</option>
                        <option value="HIDDEN">ẨN (HIDDEN)</option>
                      </select>
                      <button className="rounded-lg bg-slate-900 px-3 py-1.5 font-bold text-white hover:bg-slate-800 transition-colors text-xs">
                        Lưu
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
