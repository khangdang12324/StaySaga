import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("vi-VN");

export default async function HostRevenuePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/revenue");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { listings, totalRevenue, pendingBookings, averageRating } = await getHostDashboardData();
  const averageRevenue = pendingBookings > 0 ? Math.round(totalRevenue / pendingBookings) : 0;
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="revenue" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Doanh thu chiến lược</h1>
        <p className="mt-3 text-slate-700">
          Xem chiến lược kinh doanh hiện tại và các cơ hội phát triển doanh thu dựa trên dữ liệu Supabase.
        </p>

        <section className="mt-8 border border-slate-200 bg-white p-6">
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <label>
              <span className="mb-2 block text-sm font-bold">Lọc theo thời gian</span>
              <select className="border border-slate-400 px-4 py-3 font-semibold">
                <option>Đầu tháng đến nay</option>
                <option>7 ngày gần nhất</option>
                <option>30 ngày gần nhất</option>
              </select>
            </label>
            <button className="rounded bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#f60057]">Hiển thị</button>
          </div>

          <h2 className="text-2xl font-black">Thống kê về các đơn đặt</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mức đóng góp ước tính từ dữ liệu đặt phòng của các chỗ nghỉ do Quý vị sở hữu.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
            <StatBox value={String(pendingBookings)} label="Đơn đặt" />
            <StatBox value={`VND ${currency.format(totalRevenue)}`} label="Doanh thu" />
            <StatBox value={`VND ${currency.format(averageRevenue)}`} label="Doanh thu trung bình" />
            <StatBox value="0%" label="Tỉ lệ hủy" />
            <StatBox value="0 ngày" label="Thời gian lưu trú trung bình" />
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <InsightCard
            title="Giá theo quốc gia"
            value={`${listings.length} chỗ nghỉ`}
            description="Tạo giá riêng cho thị trường mục tiêu để tăng khả năng cạnh tranh."
          />
          <InsightCard
            title="Giá trên điện thoại"
            value={`${listings.length} chỗ nghỉ đủ điều kiện`}
            description="Ưu đãi cho khách dùng thiết bị di động có thể tăng lượt xem và đơn đặt."
          />
          <InsightCard
            title="StaySaga Genius"
            value={`${averageRating.toFixed(1)} điểm trung bình`}
            description="Theo dõi chất lượng chỗ nghỉ và cơ hội tăng hiển thị trong kết quả tìm kiếm."
          />
        </section>
      </main>
    </HostExtranetShell>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-slate-200 pr-4 last:border-r-0">
      <p className="text-2xl font-black text-[#f60057]">{value}</p>
      <p className="mt-2 text-sm text-slate-700">{label}</p>
    </div>
  );
}

function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-6 text-2xl font-black">{value}</p>
      <p className="mt-4 text-slate-700">{description}</p>
      <button className="mt-6 font-bold text-[#f60057]">Thêm đồng loạt</button>
    </div>
  );
}
