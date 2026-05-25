import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminReviewsClient } from "./AdminReviewsClient";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";

type AdminReviewsPageProps = {
  searchParams?: Promise<{
    rating?: string;
    status?: string;
    error?: string;
  }>;
};

type ReviewQueryRow = {
  id: string;
  rating: number;
  comment: string;
  status: string | null;
  created_at: string;
  user: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  homestay: { name: string | null; city: string | null } | { name: string | null; city: string | null }[] | null;
};

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const supabaseAdmin = await createAdminClient();

  // Query reviews with related user and homestay records
  const { data: dbReviews, error } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, comment, status, created_at, user:profiles(full_name, email), homestay:homestays(name, city)")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    console.error("Lỗi lấy danh sách đánh giá admin:", error);
  }

  // Parse arrays into single objects if relationships return array lists
  const parsedReviews = ((dbReviews || []) as ReviewQueryRow[]).map((review) => {
    const userData = Array.isArray(review.user) ? review.user[0] : review.user;
    const homestayData = Array.isArray(review.homestay) ? review.homestay[0] : review.homestay;
    return {
      ...review,
      user: userData || null,
      homestay: homestayData || null,
    };
  });

  return (
    <AdminShell
      title="Đánh giá từ khách hàng"
      description="Quản lý đánh giá và nhận xét của khách du lịch dành cho các chỗ nghỉ. Ẩn các bình luận độc hại hoặc spam."
      activePath="/admin/reviews"
    >
      {/* Mount Client component that manages interactive filtering and visibility updates */}
      <AdminReviewsClient
        initialReviews={parsedReviews}
        prefilledRatingFilter={params.rating}
      />
      
      {/* Supabase Realtime Subscription */}
      <RealtimeSubscription table="reviews" />
    </AdminShell>
  );
}
