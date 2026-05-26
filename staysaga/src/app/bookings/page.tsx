import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { ChevronRight, HelpCircle, X, Calendar, MapPin, Inbox, RefreshCw } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import { format } from "date-fns";

export default async function BookingsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await connection();

  const searchParams = await props.searchParams;
  // Support both 't' (requested) and 'tab' (legacy fallback)
  const activeTab = searchParams.t || searchParams.tab || "upcoming";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login?next=/bookings");

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";
  const t = (vi: string, en: string) => (lang === "EN" ? en : vi);

  // Fetch real bookings from DB
  const { data: bookings, error: dbError } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(id, name, slug, city, address, is_active, homestay_images(url))")
    .eq("user_id", session.user.id)
    .order("check_in_date", { ascending: false });

  if (dbError) {
    console.error("Lỗi lấy danh sách đặt phòng:", dbError);
  }

  const dbBookings = bookings || [];

  const today = new Date().toISOString().split("T")[0];

  // Grouping/Filtering Logic:
  // 1. Sắp tới (upcoming): status in PENDING, CONFIRMED and check_out >= today
  // 2. Đã qua (past): status in COMPLETED, NO_SHOW or (check_out < today and status != CANCELLED)
  // 3. Đã hủy (cancelled): status = CANCELLED
  const filteredBookings = dbBookings.filter((booking: any) => {
    const status = booking.status || "PENDING";
    const checkOut = booking.check_out_date || "";
    const isCancelled = status === "CANCELLED";
    const isPastDate = checkOut < today;

    if (activeTab === "cancelled") {
      return isCancelled;
    }
    if (activeTab === "past") {
      if (isCancelled) return false;
      return ["COMPLETED", "NO_SHOW"].includes(status) || isPastDate;
    }
    // upcoming
    if (isCancelled) return false;
    return ["PENDING", "CONFIRMED"].includes(status) && !isPastDate;
  });

  const hasBookings = filteredBookings.length > 0;

  // Sort bookings by check-in date ascending
  const sortedBookingsForGrouping = [...filteredBookings].sort((a: any, b: any) => {
    const aDate = a.check_in_date || "";
    const bDate = b.check_in_date || "";
    return aDate.localeCompare(bDate);
  });

  // Group bookings by city and date proximity (trips clustering)
  const groupsList: Array<{
    cityName: string;
    bookings: any[];
    earliestBooking: any;
    latestBooking: any;
  }> = [];

  for (const booking of sortedBookingsForGrouping) {
    const city = booking.homestay?.city || booking.homestay?.address?.split(",")?.slice(-1)?.[0]?.trim() || "Đà Lạt";
    const cleanCity = city === "Việt Nam" ? "Đà Lạt" : city;
    
    let foundGroup = false;
    for (const g of groupsList) {
      if (g.cityName === cleanCity) {
        // Group together if check-in is within 5 days of another check-out/check-in in the same city
        const isClose = g.bookings.some((b: any) => {
          const bCheckIn = new Date(b.check_in_date);
          const bCheckOut = new Date(b.check_out_date);
          const currCheckIn = new Date(booking.check_in_date);
          const currCheckOut = new Date(booking.check_out_date);
          
          const diff1 = Math.abs(currCheckIn.getTime() - bCheckOut.getTime()) / (1000 * 60 * 60 * 24);
          const diff2 = Math.abs(bCheckIn.getTime() - currCheckOut.getTime()) / (1000 * 60 * 60 * 24);
          
          return diff1 <= 5 || diff2 <= 5;
        });

        if (isClose) {
          g.bookings.push(booking);
          foundGroup = true;
          break;
        }
      }
    }

    if (!foundGroup) {
      groupsList.push({
        cityName: cleanCity,
        bookings: [booking],
        earliestBooking: booking,
        latestBooking: booking,
      });
    }
  }

  // Update dates and sort groups (earliest first for upcoming, latest first for past/cancelled)
  const sortedCityGroups = groupsList.map((g) => {
    const sorted = [...g.bookings].sort((a, b) => {
      const aDate = a.check_in_date || "";
      const bDate = b.check_in_date || "";
      return aDate.localeCompare(bDate);
    });
    return {
      cityName: g.cityName,
      bookings: sorted,
      earliestBooking: sorted[0],
      latestBooking: sorted[sorted.length - 1],
    };
  }).sort((a, b) => {
    const aDate = a.earliestBooking.check_in_date || "";
    const bDate = b.earliestBooking.check_in_date || "";
    if (activeTab === "upcoming") {
      return aDate.localeCompare(bDate);
    } else {
      return bDate.localeCompare(aDate);
    }
  });

  const formatPrice = (amount: number) => {
    if (currency === "USD") {
      return `USD ${(amount / 27000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `₫${amount.toLocaleString("vi-VN")}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20 font-sans">
      {/* Premium StaySaga Header */}
      <header className="bg-rose-600 pt-3.5 pb-3.5 shadow-md">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-white text-2xl font-black tracking-tight select-none">
            StaySaga
          </Link>
          <div className="flex items-center gap-3 text-white text-sm font-bold">
            <span className="hidden sm:inline hover:bg-rose-700 p-2 px-3 rounded-lg cursor-pointer transition-colors">
              {currency}
            </span>
            <div className="hover:bg-rose-700 p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center">
              {lang === "VN" ? (
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border border-red-700">
                  <span className="text-yellow-400 text-xs leading-none">★</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center border border-blue-900 overflow-hidden relative">
                  <div className="absolute w-full h-1 bg-red-600 top-1/2 -translate-y-1/2 z-10" />
                  <div className="absolute h-full w-1 bg-red-600 left-1/2 -translate-x-1/2 z-10" />
                  <div className="absolute w-full h-2 bg-white top-1/2 -translate-y-1/2 z-0" />
                  <div className="absolute h-full w-2 bg-white left-1/2 -translate-x-1/2 z-0" />
                </div>
              )}
            </div>
            <div className="hover:bg-rose-700 p-2 rounded-lg cursor-pointer transition-colors">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="hidden lg:inline hover:bg-rose-700 p-2 px-3 rounded-lg cursor-pointer transition-colors">
              {t("Đăng chỗ nghỉ của Quý vị", "List your property")}
            </div>
            <div className="flex items-center gap-2 hover:bg-rose-700 p-2 rounded-lg cursor-pointer transition-colors ml-1">
              <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center text-rose-900 font-extrabold shadow-inner">
                {session?.user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs text-rose-100 font-normal leading-none">{t("Tài khoản", "Account")}</span>
                <span className="text-[13px] leading-tight font-bold mt-0.5">
                  {session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t("Đặt chỗ & Chuyến đi", "Trips & Bookings")}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t("Quản lý và cập nhật thông tin tất cả kỳ lưu trú của bạn", "Manage and update your stays details")}
            </p>
          </div>
          <a href="/help" className="text-rose-600 text-sm font-semibold hover:text-rose-750 transition-colors flex items-center gap-1.5 self-start sm:self-center">
            <span>{t("Bạn không tìm thấy đặt phòng?", "Can't find your booking?")}</span>
          </a>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 mb-8 bg-slate-200/60 p-1 rounded-xl w-fit border border-slate-200">
          <Link
            href="/bookings?t=upcoming"
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "upcoming"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            {t("Sắp tới", "Upcoming")}
          </Link>
          <Link
            href="/bookings?t=past"
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "past"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            {t("Đã qua", "Past")}
          </Link>
          <Link
            href="/bookings?t=cancelled"
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "cancelled"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            {t("Đã hủy", "Cancelled")}
          </Link>
        </div>

        {/* Bookings Viewport */}
        {hasBookings ? (
          <div className="space-y-10">
            {/* Grouped by city (Booking.com Trips style) - For all tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {sortedCityGroups.map((group) => {
                const cityName = group.cityName;
                const count = group.bookings.length;
                const earliestCheckIn = group.earliestBooking.check_in_date ? new Date(group.earliestBooking.check_in_date) : new Date();
                const latestCheckOut = group.latestBooking.check_out_date ? new Date(group.latestBooking.check_out_date) : new Date();
                
                const formattedDates = lang === "EN"
                  ? `${format(earliestCheckIn, "d MMM")} – ${format(latestCheckOut, "d MMM")}`
                  : `${format(earliestCheckIn, "d")} tháng ${format(earliestCheckIn, "M")} – ${format(latestCheckOut, "d")} tháng ${format(latestCheckOut, "M")}`;

                const imgUrl = getLocationImage(cityName);

                return (
                  <Link
                    href={`/bookings/${group.earliestBooking.id}`}
                    key={`${cityName}-${group.earliestBooking.id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col cursor-pointer duration-350"
                  >
                    <div className="h-44 w-full relative overflow-hidden">
                      <SafeImage
                        src={imgUrl}
                        alt={cityName}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-rose-600 transition-colors">
                          {cityName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-semibold">
                          {formattedDates} · {count} {t("đơn đặt", "booking")}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Satisfaction survey block (Booking.com style) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl shadow-sm relative overflow-hidden flex gap-5 items-start">
              <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close survey">
                <X className="w-4 h-4" />
              </button>

              {/* Character illustration */}
              <div className="hidden sm:block shrink-0 mt-1">
                <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="32" fill="#FFE4E6" />
                  <path d="M48 48C48 39.1634 40.8366 32 32 32C23.1634 32 16 39.1634 16 48" fill="#F43F5E" />
                  <circle cx="32" cy="22" r="8" fill="#FDA4AF" />
                  <circle cx="44" cy="20" r="7" fill="#F59E0B" />
                  <text x="41" y="24" fill="white" fontSize="11" fontWeight="black" fontFamily="sans-serif">?</text>
                </svg>
              </div>

              <div className="flex-1">
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block mb-1">
                  {t("Câu 1/2", "Question 1/2")}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                  {t("Các chuyến đi của tôi được sắp xếp đúng như tôi mong đợi.", "My trips are organized exactly as I expected.")}
                </h3>
                
                {/* 1 to 5 scale */}
                <div className="mt-4 flex gap-2.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="w-11 h-11 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 active:bg-rose-100 transition-all shadow-sm cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                </div>
                
                <div className="mt-3 flex justify-between text-xs text-slate-400 font-semibold max-w-[280px]">
                  <span>{t("Hoàn toàn không đồng ý", "Strongly disagree")}</span>
                  <span>{t("Hoàn toàn đồng ý", "Strongly agree")}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Empty State Layout
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center px-6">
            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 border border-rose-100">
              <Inbox className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-950 mb-2">
              {activeTab === "upcoming"
                ? t("Chưa có chuyến đi nào sắp tới", "No upcoming trips yet")
                : activeTab === "past"
                ? t("Bạn chưa có chuyến đi đã hoàn tất", "You have no completed trips")
                : t("Bạn chưa có đơn đặt phòng đã hủy", "You have no cancelled bookings")}
            </h2>
            {activeTab === "upcoming" ? (
              <>
                <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                  {t(
                    "Bắt đầu khám phá và đặt chỗ cho chuyến đi tiếp theo của bạn ngay hôm nay!",
                    "Start exploring and book your next trip with us today!"
                  )}
                </p>
                <Link
                  href="/homestays"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg inline-block"
                >
                  {t("Khám phá chỗ nghỉ", "Explore homestays")}
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-400 max-w-xs">
                {t(
                  "Tất cả thông tin các đơn đặt phòng của bạn sẽ được hiển thị ở đây.",
                  "All your booking records will be displayed here."
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
