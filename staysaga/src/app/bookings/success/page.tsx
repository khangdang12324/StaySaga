import { Check, Smartphone, Info, Calendar, Copy, HelpCircle, Mail, Phone, X, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { differenceInDays, format } from "date-fns";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import PrintConfirmationButton from "./PrintConfirmationButton";
import MockBookingCookieSync from "./MockBookingCookieSync";

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

  // Fetch messages from DB if bookingId exists
  let messages: any[] = [];
  if (bookingId) {
    const { data: msgData } = await supabase
      .from("booking_messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    messages = msgData || [];
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
  const dateLabel = `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] pt-24 pb-20">
      <MockBookingCookieSync bookingId={bookingId || ""} checkIn={checkIn || ""} />

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
                   <PrintConfirmationButton 
                     label={t("In xác nhận đặt phòng", "Print confirmation")}
                     booking={booking}
                     messages={messages}
                     lang={lang}
                     currency={currency}
                     userEmail={userEmail}
                     totalPrice={Number(totalPrice)}
                     nights={nights}
                     displayCode={displayCode}
                     pinCode={pinCode}
                     dateLabel={dateLabel}
                     mainImage={mainImage}
                     hotelName={hotelName}
                     city={city}
                     startDateStr={startDate.toISOString()}
                     endDateStr={endDate.toISOString()}
                   />
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
                         <Link href={`/bookings/${bookingId}`} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded text-sm transition-all">
                            {t("Xem hoặc cập nhật chi tiết", "View or update details")}
                          </Link>
                      </div>
                   </div>
                </div>
             </div>

             {/* Contact Property Section */}
             <div className="bg-white border border-zinc-200 rounded p-6 shadow-sm mt-6">
                <h2 className="text-xl font-bold mb-1 text-zinc-900">{t("Liên hệ với chỗ nghỉ", "Contact the property")}</h2>
                <p className="text-sm text-zinc-550 mb-6">
                   {t("Bạn có thắc mắc hoặc cần thu xếp một số thứ cho kỳ nghỉ?", "Have a question or need to arrange something for your stay?")}
                </p>
                <div className="space-y-6">
                   <div className="flex gap-4 items-start">
                      <Mail className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
                      <div>
                         <h4 className="font-bold text-sm text-zinc-900">{t("Gửi email cho chỗ nghỉ", "Email the property")}</h4>
                         <p className="text-[13px] text-zinc-600 mb-1 leading-normal">
                            {t("Hãy email cho chỗ nghỉ và họ sẽ trả lời sớm nhất có thể", "Email the property and they will respond as soon as possible")}
                         </p>
                         <a href={`mailto:${booking?.homestay?.owner?.email || "owner@staysaga.com"}`} className="text-blue-600 hover:underline font-semibold text-sm">
                            {t("Gửi email", "Send email")}
                         </a>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <Phone className="w-5 h-5 text-zinc-500 mt-1 shrink-0" />
                      <div>
                         <h4 className="font-bold text-sm text-zinc-900">{t("Lựa chọn khác", "Other options")}</h4>
                         <a href={`tel:${booking?.homestay?.owner?.phone || "+842836225811"}`} className="text-blue-600 hover:underline font-semibold text-sm">
                            {t("Gọi điện", "Call")} {booking?.homestay?.owner?.phone || "+842836225811"}
                         </a>
                      </div>
                   </div>
                </div>
             </div>

             <section id="booking-details" className="scroll-mt-8 space-y-8 border-t border-zinc-200 pt-8">
                <div>
                   <h2 className="text-2xl font-bold text-rose-600 mb-4">{hotelName}<span className="ml-2 text-amber-400 text-base">★★★</span><span className="ml-2 rounded bg-rose-600 px-2 py-1 text-sm text-white">Genius</span></h2>
                   <div className="grid gap-6 md:grid-cols-[1fr_160px]">
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="border-r border-zinc-200 pr-6">
                               <div className="flex items-start gap-3">
                                  <Calendar className="mt-1 h-5 w-5 text-zinc-700" />
                                  <div>
                                     <p className="font-bold">Nhận phòng</p>
                                     <p className="text-lg font-bold">{format(startDate, "EEE, dd MMM yyyy")}</p>
                                     <p className="text-sm text-zinc-600">14:00 - 00:00</p>
                                     <a href="#" className="mt-2 inline-block font-bold text-rose-600 hover:underline">Thay đổi ngày tháng</a>
                                  </div>
                               </div>
                            </div>
                            <div>
                               <p className="font-bold">Trả phòng</p>
                               <p className="text-lg font-bold">{format(endDate, "EEE, dd MMM yyyy")}</p>
                               <p className="text-sm text-zinc-600">00:00 - 12:00</p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div>
                               <p className="font-bold">Chi tiết đặt phòng</p>
                               <p>{booking?.guests || 2} người lớn - {nights} đêm, 1 Phòng</p>
                               <a href="#" className="font-bold text-rose-600 hover:underline">Thêm lựa chọn chỗ nghỉ cho khách</a>
                            </div>
                            <div>
                               <p className="font-bold">Địa chỉ</p>
                               <p>{booking?.homestay?.address || booking?.homestay?.city || city}, Việt Nam</p>
                               <a href="#" className="font-bold text-rose-600 hover:underline">Hiển thị đường đi</a>
                            </div>
                         </div>
                      </div>
                      <div className="relative h-36 overflow-hidden rounded-lg">
                         <SafeImage src={mainImage} fill className="object-cover" />
                      </div>
                   </div>
                </div>

                <div>
                   <h2 className="mb-4 text-2xl font-bold">Chi tiết phòng</h2>
                   <div className="mb-5 flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded">
                         <SafeImage src={mainImage} fill className="object-cover" />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold">Phòng Superior Giường Đôi</h3>
                         <a href="#" className="font-bold text-rose-600 hover:underline">Thay đổi loại phòng</a>
                      </div>
                   </div>
                   <dl className="grid grid-cols-1 gap-x-8 gap-y-5 text-[15px] sm:grid-cols-[220px_1fr]">
                      <dt className="font-bold">Tên khách</dt>
                      <dd>{session?.user?.user_metadata?.full_name || userEmail} <a href="#" className="ml-3 font-bold text-rose-600 hover:underline">Thay đổi tên khách</a></dd>
                      <dt className="font-bold">Sức chứa tối đa</dt>
                      <dd>2 người lớn</dd>
                      <dt className="font-bold">Bữa ăn</dt>
                      <dd>Giá của phòng này không bao gồm bữa ăn nào.</dd>
                      <dt className="font-bold">Tùy chọn hút thuốc</dt>
                      <dd>Phòng không hút thuốc</dd>
                      <dt className="font-bold">Tiện nghi</dt>
                      <dd>Phòng tắm riêng, đồ vệ sinh cá nhân miễn phí, vòi sen, điều hòa không khí, bàn làm việc, TV màn hình phẳng, máy sấy tóc, khăn tắm, tủ hoặc phòng để quần áo, khu vực phòng ăn.</dd>
                      <dt className="font-bold">Trẻ em và giường</dt>
                      <dd><span className="font-bold">Chính sách trẻ em</span><br />Phù hợp cho tất cả trẻ em.<br /><br /><span className="font-bold">Chính sách nôi và giường phụ</span><br />Không cung cấp nôi/cũi và giường phụ.</dd>
                      <dt className="font-bold">Trả trước</dt>
                      <dd>Không cần thanh toán trước.</dd>
                      <dt className="font-bold">Phí hủy phòng</dt>
                      <dd><span className="font-bold text-green-700">Miễn phí hủy</span><br />từ {format(startDate, "dd MMM yyyy HH:mm")}: VND 0<br /><span className="mt-2 block text-sm text-zinc-600">Thời hạn hủy được tính theo giờ địa phương của chỗ nghỉ.</span></dd>
                   </dl>
                </div>

                <div className="overflow-hidden rounded border border-rose-100 bg-white">
                   <div className="flex justify-between p-5">
                      <span>1 Phòng<br />10 % Thuế GTGT</span>
                      <span className="text-right">VND {(Number(totalPrice) * 0.91).toLocaleString("vi-VN")}<br />VND {(Number(totalPrice) * 0.09).toLocaleString("vi-VN")}</span>
                   </div>
                   <div className="flex justify-between border-t border-rose-100 bg-rose-50 p-5">
                      <span className="text-xl text-rose-700">Giá<br /><span className="text-sm text-zinc-700">(dành cho {booking?.guests || 2} khách)</span></span>
                      <span className="text-2xl text-rose-700">{formatCurrency(Number(totalPrice))}</span>
                   </div>
                   <div className="space-y-4 border-t border-rose-100 p-5 text-[15px]">
                      <p><span className="font-bold">Giá cuối cùng được hiển thị là số tiền bạn sẽ thanh toán cho chỗ nghỉ.</span><br />StaySaga không thu phí khách cho bất kỳ đặt phòng, phí hành chính hay bất kỳ chi phí nào khác.</p>
                      <p><span className="font-bold">Thông tin thanh toán</span><br />{hotelName} xử lý tất cả thanh toán. Chỗ nghỉ này chấp nhận Visa, Mastercard hoặc thanh toán khi đến theo chính sách chỗ nghỉ.</p>
                      <p><span className="font-bold">Thông tin bổ sung</span><br />Các khoản phí phụ thu không được tính trong giá tổng cộng này. Nếu bạn hủy hoặc không đến nhận phòng, chỗ nghỉ vẫn có thể thu phí theo quy định.</p>
                   </div>
                </div>

                <div>
                   <h2 className="mb-4 text-2xl font-bold">Những câu hỏi thường gặp</h2>
                   <div className="grid rounded border border-zinc-200 bg-white md:grid-cols-[260px_1fr]">
                      <div className="border-b border-zinc-200 md:border-b-0 md:border-r">
                         {["Hủy phòng", "Thanh toán", "Chi tiết đặt phòng", "Trao đổi với khách", "Các loại phòng", "Giá cả", "Thẻ tín dụng", "Chính sách chỗ nghỉ"].map((item, index) => (
                           <div key={item} className={index === 0 ? "border-b-2 border-rose-600 p-4 font-bold text-rose-600" : "p-4 font-bold"}>
                              {item}
                           </div>
                         ))}
                      </div>
                      <div>
                         {[
                           "Tôi có thể hủy đặt phòng của mình không?",
                           "Nếu tôi cần hủy đặt phòng, tôi có phải trả phí không?",
                           "Tôi có thể hủy hoặc đổi ngày cho đặt phòng không hoàn tiền không?",
                           "Làm sao tôi biết được đặt phòng của mình đã được hủy?",
                         ].map((question, index) => (
                           <details key={question} className="border-b border-zinc-200 p-4" open={index === 0}>
                              <summary className="cursor-pointer text-lg font-bold">{question}</summary>
                              {index === 0 && <p className="mt-4 text-zinc-700">Có. Phí hủy đặt phòng được quyết định bởi chỗ nghỉ và hiển thị trong chính sách hủy đặt phòng của bạn.</p>}
                           </details>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="border-t border-zinc-200 pt-6">
                   <h2 className="mb-5 text-2xl font-bold">Hành động nhanh</h2>
                   <div className="grid gap-10 sm:grid-cols-2">
                      <div className="space-y-3">
                         <h3 className="font-bold">Quản lý đơn đặt</h3>
                         <a href="#" className="block font-bold text-rose-600 hover:underline">Thay đổi ngày tháng</a>
                         <a href="#" className="block font-bold text-rose-600 hover:underline">Hẹn giờ nhận phòng</a>
                         <a href="#" className="block font-bold text-rose-600 hover:underline">Thêm phòng khác</a>
                      </div>
                      <div className="space-y-3">
                         <h3 className="font-bold">Quản lý phòng</h3>
                         <a href="#" className="block font-bold text-rose-600 hover:underline">Sửa tên hoặc số lượng khách</a>
                         <a href="#" className="block font-bold text-rose-600 hover:underline">Thay đổi loại phòng</a>
                         <a href="#" className="block font-bold text-rose-600 hover:underline">Thiết lập tùy chọn hút thuốc</a>
                      </div>
                   </div>
                </div>
             </section>

          </div>

          {/* Right Column */}
          <div className="mt-6 space-y-4 lg:sticky lg:top-6 lg:self-start lg:mt-0">
             {/* Confirmation Box */}
              <div className="rounded border border-green-600 bg-green-50 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[13px] font-bold text-zinc-700">{t("Mã xác nhận:", "Confirmation number:")}</span>
                   <span className="text-[15px] font-bold flex items-center gap-2">{displayCode} <Copy className="w-4 h-4 text-rose-600 cursor-pointer" /></span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[13px] font-bold text-zinc-700">{t("Mã PIN:", "PIN code:")}</span>
                   <span className="text-[15px] font-bold flex items-center gap-2">{pinCode} <Copy className="w-4 h-4 text-rose-600 cursor-pointer" /></span>
                </div>
             </div>

              <div className="hidden">
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

               <div className="overflow-hidden rounded border border-rose-100 bg-rose-50 shadow-sm">
                  <div className="space-y-4 p-5">
                     <h3 className="text-2xl font-bold">Quản lý đơn đặt</h3>
                     <Link href={`/bookings/${bookingId}`} className="flex items-center gap-3 font-bold text-rose-600 hover:underline"><X className="h-4 w-4" /> Hủy đặt phòng</Link>
                     <Link href={`/bookings/${bookingId}`} className="flex items-center gap-3 font-bold text-rose-600 hover:underline"><Calendar className="h-4 w-4" /> Thay đổi ngày tháng</Link>
                     <Link href={`/bookings/${bookingId}`} className="flex items-center gap-3 font-bold text-rose-600 hover:underline"><MoreHorizontal className="h-4 w-4" /> Hiển thị tất cả hành động</Link>
                  </div>
                  <div className="space-y-3 border-t border-rose-100 p-5">
                     <h3 className="text-2xl font-bold">Liên hệ chỗ nghỉ</h3>
                     <p className="font-semibold text-zinc-600">Điện thoại +84 28 3622 5811</p>
                     <Link href={`/messages?bookingId=${bookingId}`} className="block font-bold text-rose-600 hover:underline">Nhắn tin</Link>
                     <a href={`mailto:${booking?.homestay?.owner?.email || "owner@staysaga.com"}`} className="block font-bold text-rose-600 hover:underline">Gửi email</a>
                  </div>
               </div>
              <div className="hidden">
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
