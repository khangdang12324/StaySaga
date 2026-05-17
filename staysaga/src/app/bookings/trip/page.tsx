import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import { format } from "date-fns";
import { ChevronRight, Edit2, FileText, MapPin, MessageSquare, Settings, MoreVertical, HelpCircle } from "lucide-react";

export default async function TripPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const bookingId = searchParams.bookingId;

  if (!bookingId) {
    redirect("/bookings");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const mockCookie = cookieStore.get("mock_bookings");
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";
  const t = (vi: string, en: string) => lang === "EN" ? en : vi;
  
  const formatCurrency = (amount: number) => {
     if (currency === "USD") {
        return `USD ${(amount / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
     }
     return `VND ${amount.toLocaleString("vi-VN")}`;
  };

  let mockBookings: any[] = [];
  if (mockCookie?.value) {
    try { mockBookings = JSON.parse(mockCookie.value); } catch {}
  }

  let booking = mockBookings.find(b => b.id === bookingId);

  if (!booking) {
    const { data } = await supabase
      .from("bookings")
      .select("*, homestay:homestays(name, slug, city, homestay_images(url))")
      .eq("id", bookingId)
      .single();
    booking = data;
  }

  if (!booking) {
    redirect("/bookings");
  }

  const city = booking.homestay?.city || booking.homestay?.location || "Đà Lạt";
  const hotelName = booking.homestay?.name || booking.homestay?.title || "Khách sạn";
  const checkInDate = booking.check_in_date ? new Date(booking.check_in_date) : new Date();
  const checkOutDate = booking.check_out_date ? new Date(booking.check_out_date) : new Date(checkInDate.getTime() + 86400000);
  const formattedDates = `${format(checkInDate, "d")} ${t("tháng", "th")} ${format(checkInDate, "M, yyyy")} – ${format(checkOutDate, "d")} ${t("tháng", "th")} ${format(checkOutDate, "M, yyyy")}`;
  const imgUrl = booking.homestay?.homestay_images?.[0]?.url || getLocationImage(city);
  const totalPrice = booking.total_price || 0;

  const today = new Date().toISOString().split("T")[0];
  const isCancelled = booking.status === "CANCELLED";
  const isPast = (booking.check_out_date?.slice(0, 10) || "") < today;
  const isUpcoming = !isCancelled && !isPast;

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
                       <span className="text-yellow-400 text-[10px] leading-none">★</span>
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

      <div className="bg-white border-b border-zinc-200 py-3">
         <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 text-[13px]">
            <Link href="/bookings" className="text-rose-600 hover:underline font-medium">{t("Đặt chỗ & Chuyến đi", "Bookings & Trips")}</Link>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-600">{city}</span>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
         {/* Hero Header */}
         {isUpcoming ? (
            <div className="relative w-full h-48 md:h-64 rounded-t-lg overflow-hidden flex items-center justify-center text-white mb-0 shadow-sm">
               <SafeImage src={getLocationImage(city)} fill className="object-cover brightness-50" />
               <div className="relative z-10 text-center">
                  <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                     {city} <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  </h1>
                  <p className="font-medium text-[15px]">{formattedDates}</p>
               </div>
            </div>
         ) : (
            <div className="mb-6 pl-2 border-l border-zinc-300 ml-4 relative">
               <h1 className="text-3xl font-bold flex items-center gap-2 relative -left-4">
                  {city} <button className="w-8 h-8 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-50 transition-colors"><Edit2 className="w-4 h-4 text-zinc-600" /></button>
               </h1>
               <p className="text-[15px] text-zinc-700 mt-2">{formattedDates}</p>
            </div>
         )}

         {/* Hotel Booking Card */}
         <div className={`bg-white border border-zinc-200 shadow-sm ${isUpcoming ? 'rounded-b-lg' : 'rounded-lg'}`}>
            <div className={`p-4 flex flex-col md:flex-row gap-4 ${isUpcoming ? 'border-b border-zinc-200' : ''} cursor-pointer hover:bg-zinc-50 transition-colors relative`}>
               <Link href={`/bookings/success?bookingId=${booking.id}`} className="absolute inset-0 z-0" aria-label="View Booking Details"></Link>
               
               <div className={`${isUpcoming ? 'w-full md:w-40 h-32' : 'w-24 h-24'} relative shrink-0 rounded overflow-hidden z-10`}>
                  <SafeImage src={imgUrl} fill className="object-cover" />
               </div>
               
               <div className="flex-1 z-10">
                  <div className="flex justify-between items-start">
                     <div>
                        <h2 className={`font-bold ${isUpcoming ? 'text-[17px]' : 'text-[15px]'} mb-1 leading-tight`}>{hotelName}</h2>
                        
                        {isUpcoming ? (
                           <>
                              <p className="text-[13px] text-zinc-600 mb-2">{formattedDates} · {city} · {t("Chính sách hủy", "Cancellation Policy")}</p>
                              <p className="text-[#008009] text-[13px] font-bold mb-2">{t("Đã xác nhận", "Confirmed")}</p>
                              <div className="space-y-1 text-[13px] text-zinc-700">
                                 <p>• {t("Nhận phòng", "Check-in")}: {format(checkInDate, "EEEE, d")} {t("thg", "th")} {format(checkInDate, "M")} {t("từ", "from")} 14:00</p>
                                 <p>• {t("Trả phòng", "Check-out")}: {format(checkOutDate, "EEEE, d")} {t("thg", "th")} {format(checkOutDate, "M")} {t("trước", "before")} 12:00</p>
                              </div>
                           </>
                        ) : (
                           <>
                              <p className="text-[13px] text-zinc-600 mb-1">{formattedDates} · {city}</p>
                              <p className="text-[13px] text-zinc-500">{isCancelled ? t('Đã hủy', 'Cancelled') : t('Đã hoàn thành', 'Completed')}</p>
                           </>
                        )}
                     </div>
                     <div className="text-right flex items-start gap-4">
                        <p className={`font-bold ${isUpcoming ? 'text-[17px]' : 'text-[15px]'}`}>{formatCurrency(Number(totalPrice))}</p>
                        {!isUpcoming && <MoreVertical className="w-5 h-5 text-zinc-500 mt-0.5 cursor-pointer hover:text-zinc-800" />}
                     </div>
                  </div>
               </div>
            </div>

            {/* Actions list - Only for upcoming */}
            {isUpcoming && (
               <div className="divide-y divide-zinc-100 relative z-10">
                  <Link href="#" className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                     <div className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                        <FileText className="w-5 h-5 text-zinc-500" />
                        {t("Yêu cầu hóa đơn", "Request invoice")}
                     </div>
                     <ChevronRight className="w-5 h-5 text-zinc-400" />
                  </Link>
                  <Link href="#" className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                     <div className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                        <MapPin className="w-5 h-5 text-zinc-500" />
                        {t("Xem đường đi", "Get directions")}
                     </div>
                     <ChevronRight className="w-5 h-5 text-zinc-400" />
                  </Link>
                  <Link href="#" className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                     <div className="flex items-center gap-3 text-sm font-medium text-zinc-700">
                        <MessageSquare className="w-5 h-5 text-zinc-500" />
                        {t("Nhắn tin cho chỗ nghỉ", "Message host")}
                     </div>
                     <ChevronRight className="w-5 h-5 text-zinc-400" />
                  </Link>
                  <Link href={`/bookings/success?bookingId=${booking.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors">
                     <div className="flex items-center gap-3 text-sm font-medium text-rose-600">
                        <Settings className="w-5 h-5" />
                        {t("Quản lý đặt phòng của bạn", "Manage your booking")}
                     </div>
                     <ChevronRight className="w-5 h-5 text-rose-600" />
                  </Link>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
