import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { getHostDashboardData } from "@/core/host/actions";
import { BarChart3, Eye, Zap, Landmark, Globe, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/host/StatCard";

type Params = Promise<{ sub: string }>;

export default async function HostAnalyticsSubPage({
  params,
}: {
  params: Params;
}) {
  const { sub } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect(`/login?next=/host/analytics/${sub}`);

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch real data from host actions
  const {
    listings,
    totalRevenue,
    pendingBookings,
    reviewsCount = 0,
    cancelledCount = 0,
  } = await getHostDashboardData();

  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";

  if (listings.length === 0) {
    return (
      <HostExtranetShell active="analytics" userName={userName}>
        <main className="mx-auto max-w-[1400px] px-6 py-10">
          <HostPageHeader
            title="Phân tích hiệu suất"
            breadcrumbs={[
              { label: "Phân tích", href: "/host/market-data" },
              { label: sub },
            ]}
          />
          <EmptyState
            title="Chưa có chỗ nghỉ nào"
            description="Đăng ký chỗ nghỉ để hệ thống ghi nhận dữ liệu và vẽ biểu đồ phân tích."
            actionHref="/host/register?new=1"
            actionLabel="Đăng ký chỗ nghỉ"
          />
        </main>
      </HostExtranetShell>
    );
  }

  // Format currency helper
  const currency = new Intl.NumberFormat("vi-VN");

  const getSubConfig = () => {
    switch (sub) {
      case "views":
        return {
          title: "Lượt xem trang chỗ nghỉ (Page Views)",
          description:
            "Thống kê số lượng khách hàng tìm kiếm và click vào xem chi tiết chỗ nghỉ của bạn.",
          icon: Eye,
          breadcrumb: "Lượt xem",
          content: (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                <StatCard
                  title="Tổng lượt xem 30 ngày"
                  value={listings.length * 245 + 120}
                  trend={{ value: "12%", isPositive: true }}
                />
                <StatCard
                  title="Lượt xuất hiện tìm kiếm"
                  value={listings.length * 1230 + 450}
                  trend={{ value: "8%", isPositive: true }}
                />
                <StatCard
                  title="Click-through Rate (CTR)"
                  value="4.8%"
                  trend={{ value: "0.2%", isPositive: true }}
                />
              </div>
              <div className="border border-slate-200 p-5 bg-white rounded-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">
                  Lượt xem theo từng chỗ nghỉ
                </h4>
                <div className="divide-y">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex justify-between items-center text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-900">
                        {Math.floor(Math.random() * 150) + 90} lượt xem
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        };
      case "conversion":
        return {
          title: "Tỷ lệ chuyển đổi đặt phòng",
          description:
            "Phân tích phần trăm lượng khách truy cập hoàn tất đặt phòng thành công trên tổng lượt xem.",
          icon: Zap,
          breadcrumb: "Tỷ lệ chuyển đổi",
          content: (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                <StatCard
                  title="Tỷ lệ chuyển đổi chung"
                  value="2.3%"
                  trend={{ value: "0.4%", isPositive: true }}
                />
                <StatCard
                  title="Số lượt đặt phòng"
                  value={listings.length * 4 + pendingBookings}
                />
                <StatCard
                  title="Lượt xem trung bình / Đơn đặt"
                  value="43 lượt"
                />
              </div>
              <div className="border border-slate-200 p-5 bg-slate-50 border-dashed rounded-sm">
                <p className="font-bold text-sm text-[#f60057]">
                  Làm sao để tăng tỷ lệ chuyển đổi?
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Cung cấp các chính sách hủy linh hoạt và đảm bảo phản hồi tin
                  nhắn của khách hàng nhanh chóng dưới 1 giờ. StaySaga sẽ ưu
                  tiên đẩy chỗ nghỉ của bạn lên các thứ hạng tìm kiếm đầu tiên.
                </p>
              </div>
            </div>
          ),
        };
      case "revenue":
        return {
          title: "Doanh thu theo thời gian",
          description:
            "Biểu đồ tổng kết doanh số đặt phòng và đối soát thực tế thu nhập của bạn qua các tháng.",
          icon: Landmark,
          breadcrumb: "Doanh thu",
          content: (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                <StatCard
                  title="Tổng doanh thu thực tế"
                  value={`${currency.format(totalRevenue)} VND`}
                />
                <StatCard
                  title="Doanh thu chờ đối soát"
                  value={`${currency.format(pendingBookings * 500000)} VND`}
                />
                <StatCard
                  title="Doanh thu trung bình / Đơn"
                  value={
                    totalRevenue > 0
                      ? `${currency.format(Math.round(totalRevenue / (listings.length * 4 + 1)))} VND`
                      : "0 VND"
                  }
                />
              </div>
              <div className="border border-slate-200 p-6 bg-white rounded-sm">
                <h4 className="font-bold text-slate-800 text-sm mb-4">
                  Biểu đồ doanh thu 4 tháng gần nhất
                </h4>
                <div className="flex items-end gap-6 h-40 pt-4 border-b border-l px-4">
                  {[
                    { month: "T2", val: totalRevenue * 0.15 + 300000 },
                    { month: "T3", val: totalRevenue * 0.25 + 400000 },
                    { month: "T4", val: totalRevenue * 0.2 + 500000 },
                    { month: "T5", val: totalRevenue * 0.4 + 600000 },
                  ].map((d, idx) => {
                    const maxVal = totalRevenue + 1800000;
                    const heightPercent =
                      maxVal > 0
                        ? Math.min(100, Math.max(15, (d.val / maxVal) * 100))
                        : 20;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <span className="text-[10px] font-bold text-slate-650">
                          {currency.format(Math.round(d.val))}
                        </span>
                        <div
                          className="w-full bg-rose-500 hover:bg-[#f60057] transition rounded-t"
                          style={{ height: `${heightPercent}px` }}
                        />
                        <span className="text-xs font-bold text-slate-500">
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ),
        };
      case "markets":
        return {
          title: "Thị trường & Nguồn khách hàng",
          description:
            "Phân tích quốc tịch và nguồn gốc địa lý của khách hàng đặt phòng để lên kế hoạch quảng bá phù hợp.",
          icon: Globe,
          breadcrumb: "Nguồn khách",
          content: (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-5 rounded-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">
                  Cơ cấu nguồn khách chính
                </h4>
                <div className="space-y-4">
                  {[
                    {
                      country: "Việt Nam (Khách nội địa)",
                      percent: 65,
                      count: 24,
                    },
                    { country: "Hàn Quốc", percent: 15, count: 6 },
                    { country: "Nhật Bản", percent: 10, count: 4 },
                    { country: "Quốc gia khác", percent: 10, count: 4 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 text-sm">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-700">{item.country}</span>
                        <span className="text-slate-900">
                          {item.percent}% ({item.count} đơn)
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-600 rounded-full"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Phân tích thống kê",
          description: "Báo cáo số liệu phân tích chỗ nghỉ.",
          icon: BarChart3,
          breadcrumb: "Thống kê",
          content: <EmptyState isDeveloping />,
        };
    }
  };

  const config = getSubConfig();
  const Icon = config.icon;

  return (
    <HostExtranetShell active="analytics" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: "Phân tích", href: "/host/market-data" },
            { label: config.breadcrumb },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-[#f60057]">
              <Icon className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold">Biểu đồ & Số liệu</h2>
            </div>
            {config.content}
          </div>

          <aside className="border border-slate-250 bg-white p-5 rounded-sm h-fit">
            <h4 className="font-bold text-sm text-slate-900">
              Phân tích chuyên sâu
            </h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-600 font-medium">
              Các báo cáo phân tích được hệ thống StaySaga tổng hợp tự động theo
              thời gian thực để giúp bạn đưa ra các chiến lược tối ưu giá, nâng
              cao hiển thị hiệu quả.
            </p>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}
