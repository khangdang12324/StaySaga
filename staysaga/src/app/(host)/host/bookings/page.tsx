import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("vi-VN");

export default async function HostBookingsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/bookings");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { listings, pendingBookings } = await getHostDashboardData();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="bookings" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Đặt phòng</h1>
        <p className="mt-2 text-slate-700">
          Theo dõi các đơn đặt thuộc chỗ nghỉ của tài khoản host hiện tại.
        </p>

        <div className="mt-8 flex flex-wrap items-end gap-4">
          <label>
            <span className="mb-2 block font-bold">Ngày</span>
            <select className="border border-slate-400 bg-white px-4 py-3 font-semibold">
              <option>Nhận phòng</option>
              <option>Trả phòng</option>
              <option>Ngày đặt</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block font-bold">Lọc theo ngày</span>
            <input
              className="w-72 border border-slate-400 bg-white px-4 py-3 outline-[#f60057]"
              defaultValue="18 tháng 5, 2026 - 19 tháng 5, 2026"
            />
          </label>
          <button className="border border-[#f60057] px-4 py-3 font-bold text-[#f60057]">Thêm bộ lọc</button>
          <button className="rounded bg-[#f60057] px-7 py-3 font-bold text-white hover:bg-[#f60057]">Hiển thị</button>
        </div>

        <section className="mt-10 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 text-base font-black">ID chỗ nghỉ</th>
                <th className="px-4 py-4 text-base font-black">Tên chỗ nghỉ</th>
                <th className="px-4 py-4 text-base font-black">Vị trí</th>
                <th className="px-4 py-4 text-base font-black">Tên khách</th>
                <th className="px-4 py-4 text-base font-black">Nhận phòng</th>
                <th className="px-4 py-4 text-base font-black">Ngày đi</th>
                <th className="px-4 py-4 text-base font-black">Tình trạng</th>
                <th className="px-4 py-4 text-base font-black">Tổng thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings > 0 ? (
                listings.slice(0, pendingBookings).map((listing) => (
                  <tr key={listing.id} className="border-b border-slate-200">
                    <td className="px-4 py-4">{listing.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 font-bold">{listing.name}</td>
                    <td className="px-4 py-4">{listing.city || "Việt Nam"}</td>
                    <td className="px-4 py-4">Khách StaySaga</td>
                    <td className="px-4 py-4">Hôm nay</td>
                    <td className="px-4 py-4">Ngày mai</td>
                    <td className="px-4 py-4 font-bold text-[#f60057]">Đang chờ xác nhận</td>
                    <td className="px-4 py-4">VND {currency.format(listing.price_per_night)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-slate-600">
                    Chưa có đặt phòng mới từ dữ liệu Supabase.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </HostExtranetShell>
  );
}
