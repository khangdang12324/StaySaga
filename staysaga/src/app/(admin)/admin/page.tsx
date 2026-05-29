import { AdminShell, requireAdmin } from "./_components/AdminShell";
import {
  getAdminDashboardStats,
  getRecentBookings,
  getPendingAdminTasks,
  getBookingsLast7Days,
} from "@/core/admin/queries";
import { format } from "date-fns";
import {
  DollarSign,
  Calendar,
  Percent,
  Home,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users,
  MessageSquare,
  Trash2,
} from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  // Enforce ADMIN role and ACTIVE status check on load
  await requireAdmin();

  const stats = await getAdminDashboardStats();
  const recentBookings = await getRecentBookings(6);
  const tasks = await getPendingAdminTasks();
  const chartData = await getBookingsLast7Days();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatShortDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="rounded-lg px-2.5 py-1 text-xs font-black bg-emerald-100 text-emerald-800">
            Đã xác nhận
          </span>
        );
      case "PENDING":
        return (
          <span className="rounded-lg px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-800">
            Chờ xử lý
          </span>
        );
      case "CANCELLED":
        return (
          <span className="rounded-lg px-2.5 py-1 text-xs font-black bg-red-100 text-red-800">
            Đã hủy
          </span>
        );
      case "COMPLETED":
        return (
          <span className="rounded-lg px-2.5 py-1 text-xs font-black bg-rose-100 text-rose-800">
            Đã hoàn tất
          </span>
        );
      default:
        return (
          <span className="rounded-lg px-2.5 py-1 text-xs font-black bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminShell activePath="/admin">
      {/* Welcome & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b pb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-rose-600">
            Trang điều hành
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Hệ thống quản trị StaySaga 👋
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Cập nhật lúc: {format(new Date(), "HH:mm - dd/MM/yyyy")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/bookings"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Đơn đặt phòng
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            Cấu hình website
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (2 rows x 4 columns) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Row 1 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Doanh thu
            </h3>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 shadow-inner">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 truncate">
            {formatVND(stats.revenue)}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Doanh thu tích lũy hoàn tất/đã cọc
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Tổng đơn đặt phòng
            </h3>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 shadow-inner">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats.totalBookings}
          </p>
          <p className="text-[10px] text-rose-600 mt-2 font-bold group-hover:underline">
            Xem danh sách đặt phòng &rarr;
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Tổng người dùng
            </h3>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 shadow-inner">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats.totalUsers}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            {stats.totalPartners} đối tác · {stats.totalAdmins} quản trị viên
          </p>
        </Link>

        <Link
          href="/admin/properties"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Tổng chỗ nghỉ
            </h3>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 shadow-inner">
              <Home className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats.totalHomestays}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            {stats.approvedHomestays} đã duyệt hoạt động
          </p>
        </Link>

        {/* Row 2 */}
        <Link
          href="/admin/properties?propertyStatus=PENDING"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Chỗ nghỉ chờ duyệt
            </h3>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 shadow-inner">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {stats.pendingHomestays}
          </p>
          <p className="text-[10px] text-amber-600 mt-2 font-bold group-hover:underline">
            Xét duyệt yêu cầu mở bán &rarr;
          </p>
        </Link>

        <Link
          href="/admin/bookings?status=PENDING"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Đơn đặt mới hôm nay
            </h3>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 shadow-inner">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600">
            {stats.newBookingsToday}
          </p>
          <p className="text-[10px] text-rose-600 mt-2 font-bold group-hover:underline">
            Xem đơn đặt mới &rarr;
          </p>
        </Link>

        <Link
          href="/admin/reviews?rating=low"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Đánh giá tiêu cực
            </h3>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 shadow-inner">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600">
            {tasks.negativeReviews}
          </p>
          <p className="text-[10px] text-red-600 mt-2 font-bold group-hover:underline">
            Kiểm duyệt đánh giá xấu &rarr;
          </p>
        </Link>

        <Link
          href="/admin/properties?propertyStatus=DELETE_REQUESTED"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">
              Yêu cầu xóa chỗ nghỉ
            </h3>
            <div className="rounded-lg bg-red-50 p-2 text-red-700 shadow-inner">
              <Trash2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-700">
            {tasks.pendingDeleteRequests}
          </p>
          <p className="text-[10px] text-red-700 mt-2 font-bold group-hover:underline">
            Xử lý yêu cầu gỡ phòng &rarr;
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cần Xử Lý & Giao Dịch */}
        <div className="lg:col-span-2 space-y-8">
          {/* Action Tasks */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Công việc cần
              xử lý ngay
            </h3>
            <div className="space-y-3">
              {tasks.pendingHomestays > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                    <p className="text-xs font-bold text-slate-700">
                      {tasks.pendingHomestays} Chỗ nghỉ mới đang chờ duyệt xuất
                      bản
                    </p>
                  </div>
                  <Link
                    href="/admin/properties?propertyStatus=PENDING"
                    className="text-xs font-black text-rose-600 hover:text-rose-700"
                  >
                    Duyệt ngay
                  </Link>
                </div>
              )}
              {tasks.negativeReviews > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
                    <p className="text-xs font-bold text-slate-700">
                      {tasks.negativeReviews} Đánh giá tiêu cực (≤ 3 sao) cần
                      kiểm duyệt nội dung
                    </p>
                  </div>
                  <Link
                    href="/admin/reviews?rating=low"
                    className="text-xs font-black text-rose-600 hover:text-rose-700"
                  >
                    Xem ngay
                  </Link>
                </div>
              )}
              {tasks.pendingDeleteRequests > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-600"></div>
                    <p className="text-xs font-bold text-slate-700">
                      {tasks.pendingDeleteRequests} Yêu cầu xóa chỗ nghỉ từ đối
                      tác đang chờ duyệt
                    </p>
                  </div>
                  <Link
                    href="/admin/properties?propertyStatus=DELETE_REQUESTED"
                    className="text-xs font-black text-rose-600 hover:text-rose-700"
                  >
                    Xem xét
                  </Link>
                </div>
              )}
              {stats.newBookingsToday > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
                    <p className="text-xs font-bold text-slate-700">
                      {stats.newBookingsToday} Đơn đặt phòng mới được tạo hôm
                      nay
                    </p>
                  </div>
                  <Link
                    href="/admin/bookings?status=PENDING"
                    className="text-xs font-black text-rose-600 hover:text-rose-700"
                  >
                    Xử lý
                  </Link>
                </div>
              )}
              {tasks.pendingHomestays === 0 &&
                tasks.negativeReviews === 0 &&
                tasks.pendingDeleteRequests === 0 &&
                stats.newBookingsToday === 0 && (
                  <div className="text-center py-6 text-sm text-slate-500 font-medium">
                    🎉 Tuyệt vời! Không có công việc nào đang chờ xử lý.
                  </div>
                )}
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Giao dịch gần đây
              </h3>
              <Link
                href="/admin/bookings"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                Xem tất cả đơn đặt <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Mã đơn</th>
                    <th className="px-6 py-3.5">Khách / Chỗ nghỉ</th>
                    <th className="px-6 py-3.5">Thời gian</th>
                    <th className="px-6 py-3.5">Tổng tiền</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-500 font-medium"
                      >
                        Chưa có đơn đặt phòng nào.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((bk: any) => (
                      <tr
                        key={bk.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                          #{bk.id.split("-")[0].toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900 text-xs">
                            {bk.profiles?.full_name || "Khách Vãng Lai"}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate w-40 mt-0.5">
                            {bk.homestays?.name || "Chỗ nghỉ bị xóa"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {formatShortDate(bk.check_in_date)} -{" "}
                          {formatShortDate(bk.check_out_date)}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-900">
                          {formatVND(Number(bk.total_price) || 0)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(bk.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics Charts & Distributions */}
        <div className="space-y-6">
          {/* Mini Chart Area */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-sm">
                Lượt đặt phòng (7 ngày qua)
              </h3>
            </div>
            <div className="flex items-end gap-2 h-36">
              {chartData.counts.map((h: number, i: number) => (
                <div key={i} className="relative flex-1 group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                    {h} đơn đặt
                  </div>
                  <div
                    className="w-full bg-rose-500 rounded-t-sm transition-all duration-300 hover:bg-rose-600"
                    style={{
                      height: `${Math.max(6, (h / Math.max(1, ...chartData.counts)) * 100)}%`,
                    }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400">
              {chartData.labels.map((l: string, i: number) => (
                <span key={i}>{l}</span>
              ))}
            </div>
          </div>

          {/* Quick Info & Support Fallback */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              Phân bố quản trị
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">
                  Tài khoản Quản trị viên
                </span>
                <span className="font-black text-slate-900 bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                  {stats.totalAdmins}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">
                  Tài khoản Đối tác (Host)
                </span>
                <span className="font-black text-slate-900 bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                  {stats.totalPartners}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">
                  Khách du lịch (User)
                </span>
                <span className="font-black text-slate-900 bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {stats.totalCustomers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
