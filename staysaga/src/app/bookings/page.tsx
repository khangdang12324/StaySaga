import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import { format } from "date-fns";

export default async function BookingsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab || "upcoming";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";
  const t = (vi: string, en: string) => lang === "EN" ? en : vi;

  // Fetch bookings from DB
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(name, slug, city, homestay_images(url))")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const allBookings = bookings || [];
  
  const today = new Date().toISOString().split("T")[0];
  
  const filteredBookings = allBookings.filter(booking => {
     const isCancelled = booking.status === "CANCELLED";
     const checkOutDate = booking.check_out_date?.slice(0, 10) || "";
     const isPast = checkOutDate < today;
     
     if (tab === "cancelled") return isCancelled;
     if (tab === "past") return !isCancelled && isPast;
     return !isCancelled && !isPast; // upcoming
  });

  const hasBookings = filteredBookings.length > 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] pb-20">
      {/* Rose Header */}
      <header className="bg-rose-600 pt-3 pb-3 shadow-sm">
         <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <Link href="/" className="text-white text-2xl font-bold tracking-tight">StaySaga</Link>
            <div className="flex items-center gap-2 text-white text-sm font-bold">
               <span className="hidden sm:inline hover:bg-rose-700 p-2 px-3 rounded cursor-pointer transition-colors">{currency}</span>
               <div className="hover:bg-rose-700 p-2 rounded cursor-pointer transition-colors flex items-center justify-center">
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
               <div className="hover:bg-rose-700 p-2 rounded cursor-pointer transition-colors">
                  <HelpCircle className="w-5 h-5" />
               </div>
               <div className="hidden lg:inline hover:bg-rose-700 p-2 px-3 rounded cursor-pointer transition-colors">
                  {t("Đăng chỗ nghỉ của Quý vị", "List your property")}
               </div>
               <div className="flex items-center gap-2 hover:bg-rose-700 p-2 rounded cursor-pointer transition-colors ml-2">
                  <div className="h-8 w-8 rounded-full bg-[#febb02] flex items-center justify-center text-rose-900 font-bold">
                    {session?.user?.user_metadata?.full_name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="hidden md:flex flex-col">
                     <span>{session?.user?.user_metadata?.full_name || "Phúc Khang Đặng Nguyễn"}</span>
                  </div>
               </div>
            </div>
         </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold">
             {t("Đặt chỗ & Chuyến đi", "Bookings & Trips")}
           </h1>
           <a href="#" className="text-rose-600 text-[13px] font-bold hover:underline">{t("Bạn không tìm thấy đặt phòng?", "Can't find your booking?")}</a>
        </div>

        <div className="flex items-center gap-4 mb-6 border-b border-zinc-200 pb-2">
           <Link 
             href="/bookings?tab=upcoming" 
             className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === 'upcoming' ? 'border border-rose-600 text-rose-600' : 'text-zinc-600 hover:bg-zinc-100'} transition-colors`}
           >
             {t("Sắp tới", "Upcoming")}
           </Link>
           <Link 
             href="/bookings?tab=past" 
             className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === 'past' ? 'border border-rose-600 text-rose-600' : 'text-zinc-600 hover:bg-zinc-100'} transition-colors`}
           >
             {t("Đã qua", "Past")}
           </Link>
           <Link 
             href="/bookings?tab=cancelled" 
             className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === 'cancelled' ? 'border border-rose-600 text-rose-600' : 'text-zinc-600 hover:bg-zinc-100'} transition-colors`}
           >
             {t("Đã hủy", "Cancelled")}
           </Link>
        </div>

        {hasBookings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.map((booking: any) => {
              const city = booking.homestay?.city || booking.homestay?.location || "Đà Lạt";
              const checkInDate = booking.check_in_date ? new Date(booking.check_in_date) : new Date();
              const checkOutDate = booking.check_out_date ? new Date(booking.check_out_date) : new Date(checkInDate.getTime() + 86400000);
              const formattedDates = `${format(checkInDate, "d")} ${t("tháng", "th")} ${format(checkInDate, "M, yyyy")} – ${format(checkOutDate, "d")} ${t("tháng", "th")} ${format(checkOutDate, "M, yyyy")}`;
              const imgUrl = booking.homestay?.homestay_images?.[0]?.url || getLocationImage(city);

              return (
                <Link
                  href={`/bookings/trip?bookingId=${booking.id}`}
                  key={booking.id}
                  className="bg-white rounded overflow-hidden shadow-sm hover:shadow-md border border-zinc-200 transition-all flex flex-col cursor-pointer"
                >
                  <div className="h-40 w-full relative">
                     <SafeImage
                        src={imgUrl}
                        alt={city}
                        fill
                        className="object-cover"
                     />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                     <div>
                        <h3 className="font-bold text-[15px]">{city}</h3>
                        <p className="text-[13px] text-zinc-600 mt-0.5">{formattedDates}</p>
                        <p className="text-[13px] text-zinc-600 mt-0.5">1 {t("đơn đặt", "booking")}</p>
                     </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded border border-zinc-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {tab === 'upcoming' ? t('Chưa có chuyến đi nào sắp tới', 'No upcoming trips') : tab === 'past' ? t('Chưa có chuyến đi nào đã qua', 'No past trips') : t('Không có chuyến đi nào đã hủy', 'No cancelled trips')}
            </h2>
            {tab === 'upcoming' && (
              <>
                <p className="text-[13px] text-zinc-600 mb-6">
                  {t("Bắt đầu khám phá và đặt chỗ ở cho chuyến đi tiếp theo!", "Start exploring and book an accommodation for your next trip!")}
                </p>
                <Link
                  href="/homestays"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded text-sm transition-all inline-block"
                >
                  {t("Khám phá chỗ nghỉ", "Explore accommodations")}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
