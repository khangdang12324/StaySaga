import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { updateBookingStatus } from "@/core/admin/actions";
import { format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const supabaseAdmin = await createAdminClient();
  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, check_in_date, check_out_date, total_price, status, created_at, guest:profiles(full_name, email), homestay:homestays(name, city)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const formatShortDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AdminShell
      title="Quản lý Đơn đặt phòng (Bookings)"
      description="Giám sát toàn bộ giao dịch đặt phòng trên nền tảng StaySaga."
      activePath="/admin/bookings"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mt-6">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Mã Đơn</th>
              <th className="px-6 py-4 font-bold">Khách Hàng</th>
              <th className="px-6 py-4 font-bold">Chỗ nghỉ & Lịch trình</th>
              <th className="px-6 py-4 font-bold">Tổng tiền</th>
              <th className="px-6 py-4 font-bold text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(!bookings || bookings.length === 0) ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                  Chưa có đơn đặt phòng nào.
                </td>
              </tr>
            ) : bookings.map((booking) => {
              const guest = Array.isArray(booking.guest) ? booking.guest[0] : booking.guest;
              const homestay = Array.isArray(booking.homestay)
                ? booking.homestay[0]
                : booking.homestay;
              return (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">
                    {booking.id.split('-')[0]}...
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{guest?.full_name || guest?.email || "Khách Vãng Lai"}</p>
                    <p className="text-xs text-slate-500">{formatShortDate(booking.created_at)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{homestay?.name || "Chỗ nghỉ bị xóa"}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {formatShortDate(booking.check_in_date)} - {formatShortDate(booking.check_out_date)}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {Number(booking.total_price || 0).toLocaleString("vi-VN")} VND
                  </td>
                  <td className="px-6 py-4">
                    <form action={updateBookingStatus} className="flex justify-end gap-2">
                      <input type="hidden" name="id" value={booking.id} />
                      <select
                        name="status"
                        defaultValue={booking.status || "PENDING"}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 ${
                          booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                          booking.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="PENDING">CHỜ XỬ LÝ</option>
                        <option value="CONFIRMED">ĐÃ XÁC NHẬN</option>
                        <option value="CANCELLED">ĐÃ HỦY</option>
                        <option value="COMPLETED">ĐÃ HOÀN TẤT</option>
                        <option value="REJECTED">TỪ CHỐI</option>
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
