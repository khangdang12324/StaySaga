import { AdminShell } from "./_components/AdminShell";
import { getAdminDashboardStats, getRecentBookings, getPendingAdminTasks, getBookingsLast7Days } from "@/core/admin/queries";
import { getSiteSettings, updateSiteSettings, removeHeroImage } from "@/core/site/actions";
import { format } from "date-fns";
import { DollarSign, Calendar, TrendingUp, Percent, Home, AlertTriangle, ArrowRight, Settings, Sparkles } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";

export default async function AdminPage() {
  const settings = await getSiteSettings([
    "site_name",
    "hero_title",
    "hero_subtitle",
    "accent_color",
    "hero_image",
    "featured_destinations"
  ]);

  const stats = await getAdminDashboardStats();
  const recentBookings = await getRecentBookings(5);
  const tasks = await getPendingAdminTasks();
  const chartData = await getBookingsLast7Days();
  
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
      case 'CONFIRMED': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-700">Đã xác nhận</span>;
      case 'PENDING': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700">Chờ xử lý</span>;
      case 'CANCELLED': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700">Đã hủy</span>;
      case 'COMPLETED': return <span className="rounded px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-700">Đã hoàn tất</span>;
      default: return <span className="rounded px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <AdminShell activePath="/admin">
      {/* Welcome & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Hôm nay, {format(new Date(), "dd/MM/yyyy")}</p>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Xin chào Admin, đây là tổng quan hệ thống 👋</h2>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/bookings" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            Xem Đơn Đặt
          </Link>
          <Link href="/admin/properties" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors">
            Duyệt Chỗ Nghỉ
          </Link>
        </div>
      </div>

      <section className="hidden">
        <Link
          href="/admin/users"
          className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-wide text-rose-600">
            Phân quyền
          </p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-950">
            Người dùng & vai trò
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Đổi USER, PARTNER, ADMIN và khóa tài khoản không hợp lệ.
          </p>
        </Link>
        <Link
          href="/admin/properties"
          className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-wide text-rose-600">
            Kiểm duyệt
          </p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-950">
            Duyệt chỗ nghỉ
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Duyệt, từ chối hoặc tạm ẩn homestay/khách sạn.
          </p>
        </Link>
        <Link
          href="/admin/bookings"
          className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-wide text-rose-600">
            Vận hành
          </p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-950">
            Quản lý đặt phòng
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Theo dõi đơn mới, xác nhận, từ chối, hủy hoặc hoàn tất.
          </p>
        </Link>
        <Link
          href="/admin/reviews"
          className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
        >
          <p className="text-xs font-black uppercase tracking-wide text-rose-600">
            Nội dung
          </p>
          <h3 className="mt-2 text-lg font-extrabold text-slate-950">
            Duyệt đánh giá
          </h3>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Ẩn đánh giá vi phạm và kiểm soát chất lượng nội dung.
          </p>
        </Link>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-blue-50 transition-transform group-hover:scale-150"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600 text-sm">Doanh thu (GBV)</h3>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600 shadow-inner">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{formatVND(stats.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors cursor-pointer">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-rose-50 transition-transform group-hover:scale-150"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600 text-sm">Đơn đặt phòng</h3>
              <div className="rounded-lg bg-rose-100 p-2 text-rose-600 shadow-inner">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{stats.totalBookings}</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats.newBookingsToday} đơn đặt mới hôm nay</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors cursor-pointer">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-amber-50 transition-transform group-hover:scale-150"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600 text-sm">Tổng người dùng</h3>
              <div className="rounded-lg bg-amber-100 p-2 text-amber-600 shadow-inner">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors cursor-pointer">
          <div className="absolute right-0 top-0 h-16 w-16 -translate-y-4 translate-x-4 rounded-full bg-emerald-50 transition-transform group-hover:scale-150"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-600 text-sm">Đối tác / Chỗ nghỉ</h3>
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 shadow-inner">
                <Home className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{stats.totalHomestays}</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats.pendingHomestays} chỗ nghỉ đang chờ duyệt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cần Xử Lý & Đơn Đặt */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* To Do List */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-1">
            <div className="rounded-lg bg-white p-5 shadow-sm border border-slate-100">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Công việc cần xử lý ngay
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                    <p className="text-sm font-semibold text-slate-700">{tasks.pendingHomestays} Chỗ nghỉ mới đang chờ duyệt xuất bản</p>
                  </div>
                  <button className="text-sm font-bold text-rose-600 hover:text-rose-700">Duyệt ngay</button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <p className="text-sm font-semibold text-slate-700">{tasks.negativeReviews} Đánh giá tiêu cực cần phản hồi từ khách sạn</p>
                  </div>
                  <button className="text-sm font-bold text-rose-600 hover:text-rose-700">Xem đánh giá</button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-semibold text-slate-700">{tasks.supportTickets} Yêu cầu hỗ trợ từ đối tác (Host)</p>
                  </div>
                  <button className="text-sm font-bold text-rose-600 hover:text-rose-700">Phản hồi</button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                    <p className="text-sm font-semibold text-slate-700">{tasks.pendingDeleteRequests} Yêu cầu hủy chỗ nghỉ / phòng đang chờ duyệt</p>
                  </div>
                  <Link href="/admin/properties?propertyStatus=DELETE_REQUESTED" className="text-sm font-bold text-rose-600 hover:text-rose-700">
                    Xem xét
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Giao dịch gần nhất</h3>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Xem toàn bộ <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Mã đơn</th>
                    <th className="px-6 py-4 font-bold">Khách / Chỗ nghỉ</th>
                    <th className="px-6 py-4 font-bold">Lịch trình</th>
                    <th className="px-6 py-4 font-bold">Tổng tiền</th>
                    <th className="px-6 py-4 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">Chưa có đơn đặt phòng nào.</td>
                    </tr>
                  ) : (
                    recentBookings.map((bk: any) => (
                      <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{bk.id.split('-')[0]}...</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{bk.profiles?.full_name || 'Khách Vãng Lai'}</p>
                          <p className="text-xs text-slate-500 truncate w-40">{bk.homestays?.name || 'Chỗ nghỉ bị xóa'}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{formatShortDate(bk.check_in_date)} - {formatShortDate(bk.check_out_date)}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{formatVND(Number(bk.total_price) || 0)}</td>
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

        {/* Right Column: Analytics & Quick Setup */}
        <div className="space-y-8">
          {/* Mini Chart Area */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Lượt đặt phòng (7 ngày)</h3>
              <button className="text-slate-400 hover:text-slate-600"><Settings className="h-4 w-4" /></button>
            </div>
            <div className="flex items-end gap-2 h-40">
              {chartData.counts.map((h: number, i: number) => (
                <div key={i} className="relative flex-1 group">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                    {h} bookings
                  </div>
                  <div 
                    className="w-full bg-rose-500 rounded-t-sm transition-all duration-500 hover:bg-rose-400" 
                    style={{ height: `${Math.max(5, (h / Math.max(1, ...chartData.counts)) * 100)}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs font-medium text-slate-400">
              {chartData.labels.map((l: string, i: number) => <span key={i}>{l}</span>)}
            </div>
          </div>

          {/* Quick Settings Panel */}
          <section id="customize" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-rose-500" />
              <h3 className="font-bold text-slate-900">Cấu hình Website Frontend</h3>
            </div>
            <div className="p-6">
              <form action={updateSiteSettings} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">Tên thương hiệu</label>
                  <input
                    name="site_name"
                    defaultValue={settings.site_name || "StaySaga"}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">Tiêu đề Homepage</label>
                  <input
                    name="hero_title"
                    defaultValue={settings.hero_title || "Khám phá những điểm lưu trú tuyệt vời nhất"}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">Danh sách Điểm đến (Slug)</label>
                  <input
                    name="featured_destinations"
                    defaultValue={settings.featured_destinations || ""}
                    placeholder="ha-noi,da-lat,phu-quoc"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">Upload Banner Chính</label>
                  <input
                    type="file"
                    name="hero_image"
                    accept="image/*"
                    className="block w-full text-sm font-bold text-slate-800 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:font-bold file:text-slate-900 hover:file:bg-slate-200 transition-colors"
                  />
                  {settings.hero_image && (
                    <div className="mt-3 relative w-full h-24 rounded-lg overflow-hidden border border-slate-200 group">
                        <SafeImage src={settings.hero_image} alt="Hero" className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button formAction={removeHeroImage} className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">Xóa ảnh</button>
                        </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-md">
                  Lưu thay đổi hệ thống
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
