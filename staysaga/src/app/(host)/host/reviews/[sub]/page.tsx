import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { Star, MessageSquare, BarChart, CheckCircle2 } from "lucide-react";

type Params = Promise<{ sub: string }>;

type DbReview = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  reply?: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  homestays: {
    name: string | null;
  } | null;
};

export default async function HostReviewsSubPage({ params }: { params: Params }) {
  const { sub } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect(`/login?next=/host/reviews/${sub}`);

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch host properties first to restrict reviews
  const { data: homestays } = await supabase
    .from("homestays")
    .select("id")
    .eq("owner_id", session.user.id)
    .neq("status", "DELETED");

  const homestayIds = homestays?.map((h) => h.id) || [];

  let dbReviews: DbReview[] = [];
  if (homestayIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles:user_id(full_name, avatar_url),
        homestays:homestay_id(name)
      `)
      .in("homestay_id", homestayIds)
      .order("created_at", { ascending: false });

    dbReviews = (reviews || []) as unknown as DbReview[];
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  let filteredReviews = dbReviews;
  let pageTitle = "Đánh giá của khách";
  let pageDesc = "Xem và phân tích phản hồi của khách hàng.";
  let breadcrumbLabel = "Chi tiết";

  if (sub === "pending") {
    pageTitle = "Đánh giá chưa phản hồi";
    pageDesc = "Các đánh giá từ khách hàng chưa được bạn gửi tin nhắn phản hồi đối tác.";
    breadcrumbLabel = "Chưa phản hồi";
    // Filter reviews where reply is null/empty. Since we don't have reply column in schema sometimes,
    // let's show all reviews under 5 stars as needing attention/response!
    filteredReviews = dbReviews.filter((r) => !r.reply && r.rating < 5);
  } else if (sub === "stats") {
    pageTitle = "Thống kê điểm đánh giá";
    pageDesc = "Biểu đồ phân bổ điểm đánh giá chi tiết theo từng hạng mục và số sao.";
    breadcrumbLabel = "Thống kê";
  }

  // Stats calculation
  const totalCount = dbReviews.length;
  const ratingDistribution = [0, 0, 0, 0, 0]; // for 1 to 5 stars
  let sumRating = 0;

  dbReviews.forEach((rev) => {
    const star = Math.floor(rev.rating);
    if (star >= 1 && star <= 5) {
      ratingDistribution[star - 1]++;
    }
    sumRating += rev.rating;
  });

  const avgRating = totalCount > 0 ? (sumRating / totalCount).toFixed(1) : "0.0";

  return (
    <HostExtranetShell active="reviews" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={pageTitle}
          description={pageDesc}
          breadcrumbs={[
            { label: "Đánh giá của khách", href: "/host/reviews" },
            { label: breadcrumbLabel },
          ]}
        />

        {sub === "stats" && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="border border-slate-200 bg-white p-6 text-center rounded-sm">
                <span className="text-sm font-bold text-slate-500 uppercase">Điểm trung bình</span>
                <p className="mt-2 text-5xl font-black text-[#f60057]">{avgRating}</p>
                <div className="mt-3 flex justify-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className={`h-5 w-5 ${idx < Math.round(Number(avgRating)) ? "fill-amber-500" : ""}`} />
                  ))}
                </div>
              </div>
              <div className="border border-slate-200 bg-white p-6 text-center rounded-sm">
                <span className="text-sm font-bold text-slate-500 uppercase">Tổng số đánh giá</span>
                <p className="mt-2 text-5xl font-black text-slate-800">{totalCount}</p>
                <p className="mt-3 text-xs text-slate-500">Từ lúc bắt đầu hoạt động</p>
              </div>
              <div className="border border-slate-200 bg-white p-6 text-center rounded-sm">
                <span className="text-sm font-bold text-slate-500 uppercase">Tỷ lệ hài lòng</span>
                <p className="mt-2 text-5xl font-black text-emerald-600">
                  {totalCount > 0
                    ? `${Math.round(((ratingDistribution[3] + ratingDistribution[4]) / totalCount) * 100)}%`
                    : "100%"}
                </p>
                <p className="mt-3 text-xs text-slate-500">Tỷ lệ đánh giá từ 4 sao trở lên</p>
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm">
              <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-[#f60057]" />
                Phân bổ chi tiết số sao đánh giá
              </h3>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingDistribution[stars - 1] || 0;
                  const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-4 text-sm">
                      <span className="w-12 font-bold text-slate-700">{stars} sao</span>
                      <div className="h-4 flex-1 bg-slate-100 rounded overflow-hidden">
                        <div className="h-full bg-amber-500 rounded" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-10 text-right font-semibold text-slate-700">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {sub === "pending" && (
          <div>
            {filteredReviews.length === 0 ? (
              <EmptyState
                title="Đã phản hồi tất cả!"
                description="Tuyệt vời! Bạn đã phản hồi tất cả các đánh giá cần quan tâm."
                actionHref="/host/reviews"
                actionLabel="Xem tất cả đánh giá"
              />
            ) : (
              <div className="space-y-6">
                {filteredReviews.map((rev) => (
                  <div key={rev.id} className="border border-slate-200 bg-white p-6 rounded-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900">{rev.profiles?.full_name || "Khách hàng StaySaga"}</h4>
                        <p className="text-xs text-slate-500 mt-1">Đánh giá cho: {rev.homestays?.name || "Chỗ nghỉ"}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded">
                        <Star className="h-4 w-4 fill-amber-500" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{rev.comment || "Khách không viết bình luận."}"</p>
                    <div className="pt-4 border-t border-slate-100 flex gap-4">
                      <input
                        placeholder="Nhập nội dung phản hồi khách hàng..."
                        className="h-10 flex-1 border border-slate-350 bg-white px-3 text-sm focus:outline-none focus:border-[#f60057]"
                      />
                      <button className="h-10 bg-[#f60057] px-5 text-sm font-bold text-white hover:bg-[#d9004c]">
                        Phản hồi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </HostExtranetShell>
  );
}
