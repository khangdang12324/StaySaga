import { Check, Printer, Smartphone, Info, MapPin, ExternalLink, Calendar, CheckCircle2, Copy, HelpCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { differenceInDays, format } from "date-fns";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";

export default async function BookingSuccessPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const bookingId = searchParams.bookingId;
  const checkIn = searchParams.checkIn;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userEmail = session?.user?.email || "hdnx8m9jmp@privaterelay.appleid.com";

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";
  const t = (vi: string, en: string) => lang === "EN" ? en : vi;
  
  const formatCurrency = (amount: number) => {
     if (currency === "USD") {
        return `USD ${(amount / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
     }
     return `VND ${amount.toLocaleString("vi-VN")}`;
  };

  // Try fetching mock booking
  const mockCookie = cookieStore.get("mock_bookings");
  let mockBookings: any[] = [];
  if (mockCookie?.value) {
    try { mockBookings = JSON.parse(mockCookie.value); } catch {}
  }
  let booking = mockBookings.find(b => b.id === bookingId);

  // If not mock, fetch from DB
  if (!booking && bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select("*, homestay:homestays(*)")
      .eq("id", bookingId)
      .single();
    booking = data;
  }

  // Fallback data if direct access without booking
  const hotelName = booking?.homestay?.name || booking?.homestay?.title || "TTR Skypool Boutique Hotel";
  const city = booking?.homestay?.city || booking?.homestay?.location || "Đà Lạt";
  const totalPrice = booking?.total_price || 279650;
  const startDate = checkIn ? new Date(checkIn) : (booking?.check_in_date ? new Date(booking.check_in_date) : new Date());
  const endDate = booking?.check_out_date ? new Date(booking.check_out_date) : new Date(startDate.getTime() + 86400000);
  const nights = differenceInDays(endDate, startDate) || 1;
  const displayCode = bookingId ? bookingId.toString().slice(-10).replace(/\D/g, '').padEnd(10, '0') : "6884160358";
  const pinCode = "7142";
  const mainImage = booking?.homestay?.homestay_images?.[0]?.url || booking?.homestay?.image || getLocationImage(city);

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
             {/* Confirmation Header */}
             <div>
                <p className="text-green-700 font-bold text-sm mb-1">{t("Đã xác nhận", "Confirmed")}</p>
                <h1 className="text-3xl font-bold mb-4">{t("Đặt phòng của bạn ở", "Your booking in")} {city} {t("đã được xác nhận.", "is confirmed.")}</h1>
                
                <div className="space-y-3 mb-6">
                   <div className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                      <p>{t("Mọi thứ xong xuôi! Chúng tôi đã gửi email xác nhận đến", "All set! We sent a confirmation email to")} <span className="font-bold">{userEmail}</span></p>
                   </div>
                   <div className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                      <p><span className="font-bold">{t("Thanh toán", "Payment")}</span> {t("của bạn sẽ được xử lý bởi", "will be handled by")} {hotelName}. {t('Mục "Giá" dưới đây sẽ cung cấp thêm chi tiết cho bạn', 'See the "Price" section below for details.')}</p>
                   </div>
                   <div className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                      <p><a href="#" className="text-rose-600 hover:underline">{t("Tải ứng dụng", "Download the app")}</a> {t("để lưu bản xác nhận điện tử", "to save your e-confirmation")}</p>
                   </div>
                </div>

                <div className="flex flex-wrap gap-3">
                   <button className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-all">
                      <Smartphone className="w-4 h-4" />
                      {t("Lưu xác nhận vào điện thoại", "Save to phone")}
                   </button>
                   <button className="border border-rose-600 text-rose-600 hover:bg-rose-50 font-bold px-4 py-2 rounded text-sm flex items-center gap-2 transition-all">
                      <Printer className="w-4 h-4" />
                      {t("In xác nhận đặt phòng", "Print confirmation")}
                   </button>
                </div>
             </div>

             {/* Safety Banner */}
             <div className="bg-white border border-zinc-200 rounded p-4 flex items-start gap-4 shadow-sm">
                <Info className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                   <h3 className="font-bold text-sm mb-1">{t("Luôn an toàn online", "Stay safe online")}</h3>
                   <p className="text-[13px] text-zinc-600 mb-2">{t("Vui lòng xem chính sách thanh toán của bạn. StaySaga tuyệt đối không yêu cầu bạn cung cấp thông tin tài khoản hoặc thông tin thanh toán qua điện thoại, email hay dịch vụ chat. Nếu bạn có điều gì nghi ngờ, vui lòng báo cho chúng tôi.", "Please review your payment policy. StaySaga will never ask you to provide account or payment information over phone, email or chat. If you have any doubts, please report to us.")}</p>
                   <a href="#" className="text-rose-600 text-[13px] hover:underline">{t("Tìm hiểu thêm", "Learn more")}</a>
                </div>
             </div>

             {/* Booking Summary */}
             <div>
                <h2 className="text-xl font-bold mb-4">{t("Tóm tắt đơn đặt", "Booking Summary")}</h2>
                <div className="bg-white border border-zinc-200 rounded overflow-hidden shadow-sm flex flex-col sm:flex-row">
                   <div className="w-full sm:w-48 h-36 relative shrink-0">
                      <SafeImage src={mainImage} fill className="object-cover" />
                   </div>
                   <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                         <h3 className="font-bold text-lg leading-tight mb-2">{hotelName}</h3>
                         <div className="flex items-center gap-2 text-sm text-zinc-700 mb-1">
                            <Tag className="w-4 h-4 text-zinc-500" /> {t("Tổng giá", "Total Price")}: <span className="font-bold text-[#1a1a1a]">{formatCurrency(Number(totalPrice))}</span>
                         </div>
                         <div className="flex items-center gap-2 text-[13px] text-zinc-600 mb-1">
                            <Calendar className="w-4 h-4" /> {format(startDate, "EEE, dd")} {t("tháng", "th")} {format(startDate, "MM, yyyy")} - {format(endDate, "EEE, dd")} {t("tháng", "th")} {format(endDate, "MM, yyyy")} , {nights} {t("đêm", "nights")}
                         </div>
                         <div className="flex items-center gap-2 text-[13px] text-zinc-600">
                            <Bed className="w-4 h-4" /> {t("Phòng Giường Đôi Hạng Bình Dân", "Standard Double Room")}
                         </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                         <Link href="/bookings" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded text-sm transition-all">
                            {t("Xem hoặc cập nhật chi tiết", "View or update details")}
                         </Link>
                      </div>
                   </div>
                </div>
             </div>

             {/* Directions */}
             <div className="bg-white border border-zinc-200 rounded p-4 shadow-sm">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><MapPin className="w-5 h-5 text-zinc-500" /> {t("Đi đến chỗ nghỉ", "Get directions")}</h3>
                <p className="text-[13px] text-zinc-600">{t("Từ Sân bay", "From")} Liên Khương (DLI): 28 {t("phút", "mins")} (31 km)</p>
             </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 mt-6 lg:mt-0">
             {/* Confirmation Box */}
             <div className="bg-rose-50 border-t-4 border-t-rose-600 border-l border-r border-b border-rose-200 rounded-b p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[13px] font-bold text-zinc-700">{t("Mã xác nhận:", "Confirmation number:")}</span>
                   <span className="text-[15px] font-bold flex items-center gap-2">{displayCode} <Copy className="w-4 h-4 text-rose-600 cursor-pointer" /></span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[13px] font-bold text-zinc-700">{t("Mã PIN:", "PIN code:")}</span>
                   <span className="text-[15px] font-bold flex items-center gap-2">{pinCode} <Copy className="w-4 h-4 text-rose-600 cursor-pointer" /></span>
                </div>
             </div>

             {/* App Promo */}
             <div className="bg-white border border-zinc-200 rounded p-4 shadow-sm relative overflow-hidden">
                <h3 className="font-bold text-[15px] mb-3">{t("Quản lý chuyến đi với ứng dụng", "Manage trips with the app")}</h3>
                <ul className="space-y-2 mb-4 text-[13px] text-zinc-700 relative z-10">
                   <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> {t("Chỉnh sửa đơn đặt trên từng cây số", "Edit bookings on the go")}</li>
                   <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> {t("Xem xác nhận ngoại tuyến", "View confirmation offline")}</li>
                   <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> {t("Nhắn tin cho chỗ nghỉ bất kỳ lúc nào", "Message the host anytime")}</li>
                </ul>
                <button className="border border-rose-600 text-rose-600 font-bold px-4 py-1.5 rounded text-sm bg-white relative z-10 hover:bg-rose-50 transition-all">
                   {t("Tải ứng dụng", "Download app")}
                </button>
             </div>

             {/* Ads Promo */}
             <div className="bg-white border border-zinc-200 rounded p-4 shadow-sm">
                <div className="flex items-start gap-2">
                   <Info className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                   <div>
                      <h3 className="font-bold text-[15px] mb-1">{t("Bạn đã mở khóa ưu đãi nhờ đặt với chúng tôi", "You unlocked a deal by booking with us")}</h3>
                      <div className="mt-4 p-3 border border-zinc-200 rounded flex gap-3 cursor-pointer hover:bg-zinc-50 transition-all">
                         <div className="w-10 h-10 bg-rose-600 rounded flex items-center justify-center shrink-0 font-bold text-white text-[10px]">TAXI</div>
                         <div>
                            <p className="font-bold text-[13px] leading-tight text-rose-600">{t("Đặt taxi sân bay riêng", "Book private airport taxi")}</p>
                            <span className="bg-[#008009] text-white text-[10px] font-bold px-1 rounded inline-block mt-1">-10% {t("Ưu đãi", "Deal")}</span>
                            <p className="text-[11px] text-[#008009] font-bold mt-1">{t("Có lựa chọn hủy miễn phí", "Free cancellation options")}</p>
                            <p className="text-[11px] text-zinc-500 mt-1">{t("Giá một chiều từ", "One-way from")} <span className="text-[#bf0000]">{formatCurrency(592090)}</span> <span className="line-through">{formatCurrency(657877)}</span></p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons needed but missing
function Tag(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
}
function Bed(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
}
