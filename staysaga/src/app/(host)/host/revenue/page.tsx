import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { RevenueFilter } from "../_components/RevenueFilter";
import { Wallet, XCircle, Bed, Calendar, Info, Frown } from "lucide-react";

const currency = new Intl.NumberFormat("vi-VN");

interface SearchParams {
  range?: string;
}

// Helper to get local Vietnam (GMT+7) date
function getVNTime(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const findPart = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(
    findPart("year"),
    findPart("month") - 1,
    findPart("day"),
    findPart("hour"),
    findPart("minute"),
    findPart("second")
  );
}

// Helper to format Date into "d tháng m, YYYY"
function formatVNDate(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${d} tháng ${m}, ${y}`;
}

// Helper to parse "YYYY-MM-DD" string into Date
function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default async function HostRevenuePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeParam = params.range || "month-to-date-lag";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/revenue");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  // 1. Get host listings and listings IDs
  const { listings } = await getHostDashboardData();
  const listingIds = listings.map((l) => l.id);

  // Calculate dynamic date ranges relative to GMT+7 today
  const vnToday = getVNTime();

  // Range 1 (Default): month-to-date-lag (1st of month to today - 2 days)
  const startMonthToDateLag = new Date(vnToday.getFullYear(), vnToday.getMonth(), 1);
  const endMonthToDateLag = new Date(vnToday.getFullYear(), vnToday.getMonth(), vnToday.getDate() - 2);
  if (endMonthToDateLag < startMonthToDateLag) {
    endMonthToDateLag.setDate(vnToday.getDate());
  }

  // Range 2: month-to-date (1st of month to today)
  const startMonthToDate = new Date(vnToday.getFullYear(), vnToday.getMonth(), 1);
  const endMonthToDate = vnToday;

  // Range 3: last-7-days (today - 7 days to today)
  const startLast7Days = new Date(vnToday.getFullYear(), vnToday.getMonth(), vnToday.getDate() - 7);
  const endLast7Days = vnToday;

  // Range 4: last-30-days (today - 30 days to today)
  const startLast30Days = new Date(vnToday.getFullYear(), vnToday.getMonth(), vnToday.getDate() - 30);
  const endLast30Days = vnToday;

  // Range 5: last-month (1st of last month to last day of last month)
  const startLastMonth = new Date(vnToday.getFullYear(), vnToday.getMonth() - 1, 1);
  const endLastMonth = new Date(vnToday.getFullYear(), vnToday.getMonth(), 0);

  // Map search param to selected date boundaries
  let startDate = startMonthToDateLag;
  let endDate = endMonthToDateLag;

  if (rangeParam === "month-to-date") {
    startDate = startMonthToDate;
    endDate = endMonthToDate;
  } else if (rangeParam === "last-7-days") {
    startDate = startLast7Days;
    endDate = endLast7Days;
  } else if (rangeParam === "last-30-days") {
    startDate = startLast30Days;
    endDate = endLast30Days;
  } else if (rangeParam === "last-month") {
    startDate = startLastMonth;
    endDate = endLastMonth;
  }

  // Construct filters options
  const filterOptions = [
    {
      value: "month-to-date-lag",
      label: `${formatVNDate(startMonthToDateLag)} – ${formatVNDate(endMonthToDateLag)}`,
    },
    {
      value: "month-to-date",
      label: `Đầu tháng đến nay (${formatVNDate(startMonthToDate)} – ${formatVNDate(endMonthToDate)})`,
    },
    {
      value: "last-7-days",
      label: `7 ngày gần nhất (${formatVNDate(startLast7Days)} – ${formatVNDate(endLast7Days)})`,
    },
    {
      value: "last-30-days",
      label: `30 ngày gần nhất (${formatVNDate(startLast30Days)} – ${formatVNDate(endLast30Days)})`,
    },
    {
      value: "last-month",
      label: `Tháng trước (${formatVNDate(startLastMonth)} – ${formatVNDate(endLastMonth)})`,
    },
  ];

  // Fetch bookings for these homestays
  let bookings: any[] = [];
  if (listingIds.length > 0) {
    const { data } = await supabase
      .from("bookings")
      .select("id, total_price, status, check_in_date, check_out_date, created_at, homestay_id")
      .in("homestay_id", listingIds);
    bookings = data || [];
  }

  // Filter bookings within date range
  const filteredBookings = bookings.filter((booking) => {
    if (!booking.check_in_date) return false;
    const checkIn = parseDateString(booking.check_in_date);
    return checkIn >= startDate && checkIn <= endDate;
  });

  const totalBookingsCount = filteredBookings.length;
  const activeBookings = filteredBookings.filter((b) => b.status !== "CANCELLED");
  const activeBookingsCount = activeBookings.length;
  const cancelledBookingsCount = filteredBookings.filter((b) => b.status === "CANCELLED").length;

  // Calculate stats
  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const averageRevenue = activeBookingsCount > 0 ? Math.round(totalRevenue / activeBookingsCount) : 0;
  const cancellationRate = totalBookingsCount > 0 ? Math.round((cancelledBookingsCount / totalBookingsCount) * 100) : 0;

  const totalStayDays = activeBookings.reduce((sum, b) => {
    if (!b.check_in_date || !b.check_out_date) return sum;
    const checkIn = parseDateString(b.check_in_date);
    const checkOut = parseDateString(b.check_out_date);
    const diff = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
    return sum + Math.max(0, diff);
  }, 0);
  const averageStayDuration = activeBookingsCount > 0 ? Math.round(totalStayDays / activeBookingsCount) : 0;

  const totalLeadTimeDays = activeBookings.reduce((sum, b) => {
    if (!b.check_in_date || !b.created_at) return sum;
    const checkIn = parseDateString(b.check_in_date);
    const created = new Date(b.created_at);
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const diff = Math.round((checkIn.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
    return sum + Math.max(0, diff);
  }, 0);
  const averageLeadTime = activeBookingsCount > 0 ? Math.round(totalLeadTimeDays / activeBookingsCount) : 0;

  // Genius should only count genuinely high-rated active listings.
  const geniusListings = listings.filter(
    (l) =>
      l.status === "APPROVED" &&
      l.is_active &&
      Number(l.avg_rating || 0) >= 4.5,
  );
  const geniusListingsCount = geniusListings.length;
  const geniusRatio = listings.length > 0 ? Math.round((geniusListingsCount / listings.length) * 100) : 0;

  const geniusBookings = filteredBookings.filter((b) => geniusListings.some((gl) => gl.id === b.homestay_id));
  const geniusActiveBookings = geniusBookings.filter((b) => b.status !== "CANCELLED");
  const geniusActiveBookingsCount = geniusActiveBookings.length;
  const geniusBookingsRatio = activeBookingsCount > 0 ? Math.round((geniusActiveBookingsCount / activeBookingsCount) * 100) : 0;
  const geniusRevenue = geniusActiveBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const geniusRevenueRatio = totalRevenue > 0 ? Math.round((geniusRevenue / totalRevenue) * 100) : 0;

  const geniusAverageRevenue = geniusActiveBookingsCount > 0 ? Math.round(geniusRevenue / geniusActiveBookingsCount) : 0;
  const geniusCancelledCount = geniusBookings.filter((b) => b.status === "CANCELLED").length;
  const geniusCancellationRate = geniusBookings.length > 0 ? Math.round((geniusCancelledCount / geniusBookings.length) * 100) : 0;

  const geniusTotalStayDays = geniusActiveBookings.reduce((sum, b) => {
    const diff = Math.round(
      (parseDateString(b.check_out_date).getTime() - parseDateString(b.check_in_date).getTime()) / (1000 * 3600 * 24)
    );
    return sum + diff;
  }, 0);
  const geniusAverageStayDuration = geniusActiveBookingsCount > 0 ? Math.round(geniusTotalStayDays / geniusActiveBookingsCount) : 0;

  const geniusTotalLeadTimeDays = geniusActiveBookings.reduce((sum, b) => {
    const checkIn = parseDateString(b.check_in_date);
    const created = new Date(b.created_at);
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const diff = Math.round((checkIn.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
    return sum + Math.max(0, diff);
  }, 0);
  const geniusAverageLeadTime = geniusActiveBookingsCount > 0 ? Math.round(geniusTotalLeadTimeDays / geniusActiveBookingsCount) : 0;

  // Country-rate configuration is not stored yet, so do not infer it from row order.
  const countryRateListings = listings.filter(() => false);
  const countryRateListingsCount = countryRateListings.length;
  const countryRateRatio = listings.length > 0 ? Math.round((countryRateListingsCount / listings.length) * 100) : 0;

  const countryRateBookings = filteredBookings.filter((b) => countryRateListings.some((cl) => cl.id === b.homestay_id));
  const countryRateActiveBookings = countryRateBookings.filter((b) => b.status !== "CANCELLED");
  const countryRateActiveBookingsCount = countryRateActiveBookings.length;
  const countryRateBookingsRatio = activeBookingsCount > 0 ? Math.round((countryRateActiveBookingsCount / activeBookingsCount) * 100) : 0;
  const countryRateRevenue = countryRateActiveBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const countryRateRevenueRatio = totalRevenue > 0 ? Math.round((countryRateRevenue / totalRevenue) * 100) : 0;

  const countryRateAverageRevenue = countryRateActiveBookingsCount > 0 ? Math.round(countryRateRevenue / countryRateActiveBookingsCount) : 0;
  const countryRateCancelledCount = countryRateBookings.filter((b) => b.status === "CANCELLED").length;
  const countryRateCancellationRate = countryRateBookings.length > 0 ? Math.round((countryRateCancelledCount / countryRateBookings.length) * 100) : 0;

  const countryRateTotalStayDays = countryRateActiveBookings.reduce((sum, b) => {
    const diff = Math.round(
      (parseDateString(b.check_out_date).getTime() - parseDateString(b.check_in_date).getTime()) / (1000 * 3600 * 24)
    );
    return sum + diff;
  }, 0);
  const countryRateAverageStayDuration = countryRateActiveBookingsCount > 0 ? Math.round(countryRateTotalStayDays / countryRateActiveBookingsCount) : 0;

  const countryRateTotalLeadTimeDays = countryRateActiveBookings.reduce((sum, b) => {
    const checkIn = parseDateString(b.check_in_date);
    const created = new Date(b.created_at);
    const createdDate = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const diff = Math.round((checkIn.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
    return sum + Math.max(0, diff);
  }, 0);
  const countryRateAverageLeadTime = countryRateActiveBookingsCount > 0 ? Math.round(countryRateTotalLeadTimeDays / countryRateActiveBookingsCount) : 0;
  const bookingsStat = activeBookingsCount;
  const revenueStat = totalRevenue;
  const averageRevenueStat = averageRevenue;
  const cancellationRateStat = cancellationRate;
  const averageStayDurationStat = averageStayDuration;
  const averageLeadTimeStat = averageLeadTime;

  return (
    <HostExtranetShell active="revenue" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black text-slate-900">Doanh thu chiến lược</h1>
        <p className="mt-3 text-slate-700">
          Tại đây, Quý vị có thể xem chiến lược kinh doanh hiện tại đang hoạt động ra sao và khám phá các cơ hội để phát triển doanh nghiệp.
        </p>

        {/* Filter Section */}
        <section className="mt-8 border border-slate-200 bg-white p-6 rounded shadow-sm">
          <RevenueFilter options={filterOptions} initialValue={rangeParam} />

          <h2 className="text-2xl font-black text-slate-900">Thống kê về các đơn đặt</h2>
          <p className="mt-2 text-sm text-slate-600">
            Mức đóng góp ước tính từ {formatVNDate(startDate)} đến {formatVNDate(endDate)}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6 border-t border-slate-100 pt-6">
            <StatBox value={String(bookingsStat)} label="Đơn đặt" />
            <StatBox
              value={`VND ${currency.format(revenueStat)}`}
              label="Doanh thu"
              hasInfo
              infoText="Tổng doanh thu từ các đơn đặt không bị hủy."
            />
            <StatBox value={`VND ${currency.format(averageRevenueStat)}`} label="Doanh thu trung bình của mỗi đơn đặt" />
            <StatBox value={`${cancellationRateStat}%`} label="Tỉ lệ hủy" />
            <StatBox value={`${averageStayDurationStat} ngày`} label="Thời gian lưu trú trung bình" />
            <StatBox value={`${averageLeadTimeStat} ngày`} label="Khung thời gian đặt trước trung bình" />
          </div>
        </section>

        {/* Insight Cards Grid */}
        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Genius Card */}
          <div className="border border-slate-200 bg-white p-6 rounded flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">Genius</span>
                <span className="bg-[#f60057] text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                  Genius
                </span>
              </div>
              <p className="mt-4 text-lg font-black text-slate-800">
                {geniusListingsCount}/{listings.length} ({geniusRatio}%) chỗ nghỉ của Quý vị sử dụng Genius
              </p>
              <p className="mt-4 text-xs text-slate-500 font-medium">
                Mức đóng góp ước tính từ {formatVNDate(startDate)} đến {formatVNDate(endDate)}
              </p>
              <p className="mt-2 text-xs text-slate-700">
                {geniusActiveBookingsCount}/{activeBookingsCount || 0} đặt phòng của Quý vị ({geniusBookingsRatio}%)
              </p>
              <p className="text-xs text-slate-700">
                VND {currency.format(geniusRevenue)}/VND {currency.format(revenueStat)} doanh thu của Quý vị ({geniusRevenueRatio}%)
              </p>

              {geniusActiveBookingsCount > 0 ? (
                <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                  <StatRow icon={<Wallet size={16} />} label="Doanh thu trung bình của mỗi đơn đặt" value={`VND ${currency.format(geniusAverageRevenue)}`} />
                  <StatRow icon={<XCircle size={16} />} label="Tỷ lệ hủy" value={`${geniusCancellationRate}%`} />
                  <StatRow icon={<Bed size={16} />} label="Thời gian lưu trú trung bình" value={`${geniusAverageStayDuration} ngày`} />
                  <StatRow icon={<Calendar size={16} />} label="Khung thời gian đặt trước trung bình" value={`${geniusAverageLeadTime} ngày`} />
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-slate-100 rounded">
                  <Frown size={32} className="text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 leading-normal">
                    Không có dữ liệu Genius trong khoảng thời gian này. Chỉ các chỗ nghỉ đang hoạt động và có đánh giá đủ cao mới được tính vào nhóm Genius.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Giá theo quốc gia Card */}
          <div className="border border-slate-200 bg-white p-6 rounded flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xl font-black text-slate-900">Giá theo quốc gia</span>
              <p className="mt-4 text-lg font-black text-slate-800">
                {countryRateListingsCount}/{listings.length} ({countryRateRatio}%) chỗ nghỉ của Quý vị sử dụng Giá theo quốc gia
              </p>
              <p className="mt-4 text-xs text-slate-500 font-medium">
                Mức đóng góp ước tính từ {formatVNDate(startDate)} đến {formatVNDate(endDate)}
              </p>
              <p className="mt-2 text-xs text-slate-700">
                {countryRateActiveBookingsCount}/{activeBookingsCount || 0} đặt phòng của Quý vị ({countryRateBookingsRatio}%)
              </p>
              <p className="text-xs text-slate-700">
                VND {currency.format(countryRateRevenue)}/VND {currency.format(revenueStat)} doanh thu của Quý vị ({countryRateRevenueRatio}%)
              </p>

              {countryRateActiveBookingsCount > 0 ? (
                <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                  <StatRow icon={<Wallet size={16} />} label="Doanh thu trung bình của mỗi đơn đặt" value={`VND ${currency.format(countryRateAverageRevenue)}`} />
                  <StatRow icon={<XCircle size={16} />} label="Tỷ lệ hủy" value={`${countryRateCancellationRate}%`} />
                  <StatRow icon={<Bed size={16} />} label="Thời gian lưu trú trung bình" value={`${countryRateAverageStayDuration} ngày`} />
                  <StatRow icon={<Calendar size={16} />} label="Khung thời gian đặt trước trung bình" value={`${countryRateAverageLeadTime} ngày`} />
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center text-center p-4 bg-slate-50 border border-slate-100 rounded">
                  <Frown size={32} className="text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 leading-normal">
                    Chưa có chỗ nghỉ nào bật Giá theo quốc gia trong dữ liệu hiện tại, nên hệ thống không tính đóng góp giả cho chiến lược này.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button className="font-bold text-[#f60057] hover:underline text-sm transition">Thêm đồng loạt</button>
            </div>
          </div>

          {/* Giá trên điện thoại Card */}
          <div className="border border-slate-200 bg-white p-6 rounded flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xl font-black text-slate-900">Giá trên điện thoại</span>
              <div className="mt-6 flex gap-3 p-4 bg-slate-50 border border-slate-100 rounded items-start">
                <Frown size={28} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-normal font-medium">
                  {listings.length} chỗ nghỉ đủ điều kiện của Quý vị không sử dụng Giá trên điện thoại. Bằng cách thêm Giá trên điện thoại, Quý vị có thể tăng lượt xem trong kết quả tìm kiếm lên đến 40% và tăng số lượng đơn đặt lên đến 18%.
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button className="font-bold text-[#f60057] hover:underline text-sm transition">Thêm đồng loạt</button>
            </div>
          </div>
        </section>
      </main>
    </HostExtranetShell>
  );
}

function StatBox({
  value,
  label,
  hasInfo = false,
  infoText = "",
}: {
  value: string;
  label: string;
  hasInfo?: boolean;
  infoText?: string;
}) {
  return (
    <div className="border-r border-slate-200 pr-4 last:border-r-0 last:pr-0">
      <p className="text-xl font-black text-slate-900 flex items-center">
        {value}
        {hasInfo && (
          <span className="group relative">
            <Info size={14} className="text-slate-400 cursor-pointer ml-1.5" />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded bg-slate-800 p-2 text-center text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 leading-normal">
              {infoText}
            </span>
          </span>
        )}
      </p>
      <p className="mt-2 text-xs font-semibold text-slate-500 leading-normal">{label}</p>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="font-medium text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}
