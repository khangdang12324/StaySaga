import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function HostReviewsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/reviews");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { averageRating } = await getHostDashboardData();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="reviews" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <h1 className="text-3xl font-black">Đánh giá</h1>
        <div className="mt-8 flex flex-wrap items-end gap-6">
          <label>
            <span className="mb-2 block font-bold">Lọc theo ngày</span>
            <input className="w-72 border border-slate-400 bg-white px-4 py-3 outline-[#f60057]" defaultValue="16 tháng 5, 2026 - 18 tháng 5, 2026" />
          </label>
          <label>
            <span className="mb-2 block font-bold">Lọc theo một hoặc nhiều ID chỗ nghỉ</span>
            <input className="w-72 border border-slate-400 bg-white px-4 py-3 outline-[#f60057]" placeholder="Nhập một hoặc nhiều ID chỗ nghỉ" />
          </label>
          <button className="rounded bg-[#f60057] px-6 py-3 font-bold text-white hover:bg-[#d9004c]">Hiển thị đánh giá</button>
          <input className="ml-auto w-full max-w-sm border border-slate-400 bg-white px-4 py-3 outline-[#f60057]" placeholder="Tìm theo điểm, ngày, bình luận..." />
        </div>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Stat title="Điểm trung bình" value={averageRating ? averageRating.toFixed(1) : "0"} />
          <Stat title="Đánh giá cần phản hồi" value="0" />
          <Stat title="Bình luận bị báo cáo" value="0" />
        </section>

        <div className="mt-10 flex min-h-80 items-center justify-center border border-slate-200 bg-white text-lg text-slate-600">
          Không có dữ liệu đánh giá để hiển thị.
        </div>
      </main>
    </HostExtranetShell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white p-6">
      <p className="text-3xl font-black text-[#f60057]">{value}</p>
      <p className="mt-3 font-bold">{title}</p>
    </div>
  );
}
