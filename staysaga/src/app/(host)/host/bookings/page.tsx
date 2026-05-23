import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Printer, Download, ChevronDown } from "lucide-react";

const currency = new Intl.NumberFormat("vi-VN");

const getGmt7Date = (offsetDays = 0) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    Number(parts.find((item) => item.type === type)?.value || 0);
  const date = new Date(part("year"), part("month") - 1, part("day"));
  date.setDate(date.getDate() + offsetDays);
  return date;
};

// Helper to format date in Vietnamese format
const formatDate = (d: Date) => {
  return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

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

  const today = getGmt7Date(0);
  const tomorrow = getGmt7Date(1);
  const dateRangeStr = `${formatDate(today)} – ${formatDate(tomorrow)}`;

  return (
    <HostExtranetShell active="bookings" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Đặt phòng</h1>
        <p className="mt-2 text-slate-700">
          Theo dõi các đơn đặt thuộc chỗ nghỉ của tài khoản host hiện tại.
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6 bg-white p-5 border border-slate-200/70 rounded-sm shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Ngày</span>
              <div className="relative">
                <select className="appearance-none border border-slate-300 rounded-sm bg-white pl-3 pr-9 py-2.5 text-sm font-semibold text-slate-800 outline-[#f60057] cursor-pointer">
                  <option>Nhận phòng</option>
                  <option>Trả phòng</option>
                  <option>Ngày đặt</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-slate-500" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Lọc theo ngày</span>
              <input
                className="w-64 border border-slate-300 rounded-sm bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-[#f60057]"
                defaultValue={dateRangeStr}
              />
            </label>

            <button className="border border-[#f60057] px-5 py-2.5 text-sm font-bold text-[#f60057] bg-white hover:bg-rose-50/50 rounded-sm transition-colors duration-150">
              Thêm bộ lọc
            </button>
            
            <button className="rounded-sm bg-[#f60057] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#d8004f] transition-colors duration-150">
              Hiển thị đặt phòng
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#f60057] font-bold">
            <button className="flex items-center gap-1.5 hover:underline bg-transparent border-0 cursor-pointer">
              <Printer className="h-4 w-4" />
              <span>In danh sách đặt phòng</span>
            </button>
            <button className="flex items-center gap-1.5 hover:underline bg-transparent border-0 cursor-pointer">
              <Download className="h-4 w-4" />
              <span>Tải về</span>
            </button>
          </div>
        </div>

        <section className="mt-8 overflow-x-auto border border-slate-200/80 bg-white rounded-sm shadow-sm">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50">
              <tr>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">ID chỗ nghỉ</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tên chỗ nghỉ</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Vị trí</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tên khách</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Nhận phòng</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Ngày đi</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tình trạng</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tổng thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {pendingBookings > 0 ? (
                listings.slice(0, pendingBookings).map((listing) => (
                  <tr key={listing.id} className="border-b border-slate-200 hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-4 text-slate-600">{listing.id.slice(0, 8)}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{listing.name}</td>
                    <td className="px-4 py-4 text-slate-700">{listing.city || "Việt Nam"}</td>
                    <td className="px-4 py-4 text-slate-700 font-medium">Khách StaySaga</td>
                    <td className="px-4 py-4 text-slate-700 font-medium">{formatDate(today)}</td>
                    <td className="px-4 py-4 text-slate-700 font-medium">{formatDate(tomorrow)}</td>
                    <td className="px-4 py-4 font-bold text-[#f60057]">Đang chờ xác nhận</td>
                    <td className="px-4 py-4 font-bold text-slate-900">VND {currency.format(listing.price_per_night)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500 text-[15px] font-medium bg-white">
                    <div className="flex flex-col items-center justify-center gap-3 py-6">
                      <svg className="h-14 w-14 text-slate-400 stroke-[1.25]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Quý vị không có đặt phòng trong khoảng thời gian được chọn.</p>
                    </div>
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
