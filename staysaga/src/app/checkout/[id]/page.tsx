import {
  ChevronLeft,
  Star,
  CreditCard,
  Shield,
  Check,
  Calendar,
  MapPin,
  Users,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  PawPrint,
  Wifi,
  CarFront,
  Clock3,
  Hotel,
} from "lucide-react";
import Link from "next/link";
import { getPropertyBySlug } from "@/core/properties/actions";
import { finishBooking } from "@/core/bookings/actions";
import { calculateBookingPricing } from "@/core/bookings/pricing";
import { differenceInDays, format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import { cn } from "@/lib/utils";
import CheckoutSubmitButton from "./CheckoutSubmitButton";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const checkIn = resolvedSearchParams.checkIn;
  const checkOut = resolvedSearchParams.checkOut;
  const guests = resolvedSearchParams.guests
    ? parseInt(resolvedSearchParams.guests)
    : 1;
  const stepParam = resolvedSearchParams.step;
  const bookingError = resolvedSearchParams.bookingError;
  const firstName = resolvedSearchParams.firstName || "";
  const lastName = resolvedSearchParams.lastName || "";
  const email = resolvedSearchParams.email || session.user.email || "";
  const phone = resolvedSearchParams.phone || "";
  const country = resolvedSearchParams.country || "Việt Nam";
  const hasGuestInfo = Boolean(firstName && lastName && email);
  const activeStep =
    stepParam === "finish" && hasGuestInfo
      ? "finish"
      : "details";

  if (!checkIn || !checkOut) {
    redirect(`/homestays/${resolvedParams.id}`);
  }

  const { data: property } = await getPropertyBySlug(resolvedParams.id);

  if (!property) {
    return notFound();
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const days = differenceInDays(end, start);

  if (days <= 0) {
    redirect(`/homestays/${property.slug}`);
  }

  const basePrice = property.price || (property as any).base_price || 0;
  const { accommodationsCost, discount, totalAmount } = calculateBookingPricing(
    basePrice,
    days,
  );

  const mainImage =
    property.image ||
    (property as any).images?.[0]?.url ||
    getLocationImage(property.location || (property as any).city);
  const canPayAtProperty = Boolean(
    (property as any).no_prepayment ||
      String((property as any).prepayment_policy || "")
        .toLowerCase()
        .includes("không cần thanh toán trước"),
  );
  const bookingErrorMessages: Record<string, string> = {
    auth: "Bạn cần đăng nhập để đặt phòng.",
    unavailable: "Chỗ nghỉ này hiện không thể đặt.",
    invalid_date: "Ngày nhận phòng không hợp lệ.",
    guest_required: "Vui lòng nhập đầy đủ thông tin khách.",
    create_failed: "Không thể tạo đơn đặt phòng, vui lòng thử lại.",
  };

  const steps = [
    { id: 1, label: "Bạn chọn", active: false, done: true },
    { id: 2, label: "Chi tiết về bạn", active: activeStep === "details", done: activeStep === "finish" },
    { id: 3, label: "Hoàn tất đặt phòng", active: activeStep === "finish", done: false },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      {/* Rose Header */}
      <header className="bg-rose-600 pt-3 pb-3 shadow-md">
         <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <Link href="/" className="text-white text-2xl font-black tracking-tighter">StaySaga<span className="text-rose-200">.</span></Link>
            <div className="flex items-center gap-6 text-white text-sm font-bold">
               <span className="hidden sm:inline">VND</span>
               <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-rose-600">P</div>
                  <span className="hidden md:inline">{session.user.user_metadata?.full_name || "Phúc Khang Đặng Nguyễn"}</span>
               </div>
            </div>
         </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-4 sm:gap-12">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                step.active || step.done ? "bg-rose-600 text-white border-rose-600" : "border border-zinc-400 text-zinc-500"
              )}>
                {step.done ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span className={cn(
                "text-xs sm:text-sm font-medium",
                step.active ? "text-zinc-900 font-bold" : "text-zinc-500"
              )}>
                {step.label}
              </span>
              {idx < steps.length - 1 && <div className="hidden sm:block w-12 h-px bg-zinc-300 ml-4" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          {/* Sidebar Summary */}
          <aside className="space-y-4">
             {/* Hotel Info Card */}
             <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden p-4">
                <div className="flex gap-4">
                   <div className="w-24 h-24 relative rounded-md overflow-hidden shrink-0">
                      <SafeImage src={mainImage} fill className="object-cover" />
                   </div>
                   <div>
                      <div className="flex gap-1 mb-1">
                        {[1, 2].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                      </div>
                      <h3 className="font-bold text-sm leading-tight mb-1">{property.title}</h3>
                      <p className="text-[11px] text-zinc-500 mb-2">{property.location}</p>
                      <div className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[10px] inline-block font-bold mb-2">Vị trí xuất sắc — 9.4</div>
                      <div className="flex items-center gap-2">
                         <div className="bg-rose-600 text-white p-1 rounded font-bold text-xs">9.3</div>
                         <div className="text-[11px]">
                            <p className="font-bold">Tuyệt hảo</p>
                            <p className="text-zinc-500">65 đánh giá</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-3 text-[11px] text-zinc-700">
                   <span className="flex items-center gap-1"><PawPrint className="h-3 w-3" /> Cho phép mang theo vật nuôi</span>
                   <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> WiFi miễn phí</span>
                   <span className="flex items-center gap-1"><CarFront className="h-3 w-3" /> Chỗ đỗ xe</span>
                </div>
             </div>

             {/* Booking Details Box */}
             <div className="bg-white rounded-lg border border-zinc-200 p-4">
                <h4 className="font-bold text-sm mb-4">Chi tiết đặt phòng của bạn</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                      <p className="text-xs font-bold">Nhận phòng</p>
                      <p className="text-[13px] font-bold">{format(start, "EEE, dd MMM yyyy")}</p>
                      <p className="text-[11px] text-zinc-500">14:00 – 00:00</p>
                   </div>
                   <div>
                      <p className="text-xs font-bold">Trả phòng</p>
                      <p className="text-[13px] font-bold">{format(end, "EEE, dd MMM yyyy")}</p>
                      <p className="text-[11px] text-zinc-500">12:00 – 00:00</p>
                   </div>
                </div>
                <div className="space-y-1 mb-4">
                   <p className="text-xs font-bold">Bạn đã chọn</p>
                   <p className="text-[13px]">{days} đêm, 1 phòng cho {guests} người lớn</p>
                   <p className="text-[13px] font-bold">1 x Phòng Có Giường Cỡ Queen</p>
                </div>
                <button className="text-[13px] font-bold text-rose-600 hover:underline">Đổi lựa chọn của bạn</button>
             </div>

             {/* Price Summary */}
             <div className="bg-white rounded-lg border border-zinc-200 p-4">
                <h4 className="font-bold text-sm mb-4">Tóm tắt giá</h4>
                <div className="space-y-2 text-[13px]">
                   <div className="flex justify-between">
                      <span>Giá gốc</span>
                      <span>VND {accommodationsCost.toLocaleString("vi-VN")}</span>
                   </div>
                   <div className="flex justify-between text-green-700">
                      <span>Giảm giá</span>
                      <span>- VND {discount.toLocaleString("vi-VN")}</span>
                   </div>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-baseline">
                   <span className="text-lg font-bold">Tổng cộng</span>
                   <div className="text-right">
                      <p className="text-xl font-bold">VND {totalAmount.toLocaleString("vi-VN")}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Đã bao gồm thuế và phí</p>
                   </div>
                </div>
             </div>

             {canPayAtProperty && (
               <div className="bg-white rounded-lg border border-zinc-200 p-4">
                  <h4 className="font-bold text-sm mb-4">Lịch thanh toán của bạn</h4>
                  <p className="text-[13px] leading-6 text-green-700">Không cần thanh toán hôm nay. Bạn sẽ trả khi đến nghỉ.</p>
               </div>
             )}

             {/* Cancellation Info */}
             <div className="bg-white rounded-lg border border-zinc-200 p-4">
                <h4 className="font-bold text-sm mb-2">Chi phí hủy là bao nhiêu?</h4>
                <p className={cn("text-[13px]", canPayAtProperty ? "text-green-700" : "text-zinc-600")}>
                  {canPayAtProperty
                    ? "Miễn phí hủy bất kỳ lúc nào"
                    : `Nếu hủy, bạn sẽ phải thanh toán VND ${totalAmount.toLocaleString("vi-VN")}`}
                </p>
             </div>
          </aside>

          {/* Main Form Content */}
          <main className="space-y-6">
             {/* Login Status */}
             {activeStep !== "finish" && (
               <div className="bg-white rounded-lg border border-zinc-200 p-4 flex items-center gap-4 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                     <Users className="h-5 w-5" />
                  </div>
                  <div>
                     <p className="text-sm font-bold">Bạn đã được đăng nhập</p>
                     <p className="text-[13px] text-zinc-500">{session.user.email}</p>
                  </div>
               </div>
             )}

              <form
                {...(activeStep === "finish"
                  ? { action: finishBooking }
                  : { action: `/checkout/${resolvedParams.id}`, method: "GET" })}
                className="space-y-6"
              >
                <input type="hidden" name="checkIn" value={checkIn} />
                <input type="hidden" name="checkOut" value={checkOut} />
                 <input type="hidden" name="guests" value={guests} />
                 <input type="hidden" name="step" value="finish" />
                 <input type="hidden" name="propertyId" value={String(property.id || resolvedParams.id)} />
                 <input type="hidden" name="slug" value={resolvedParams.id} />
                 <input type="hidden" name="roomId" value={resolvedSearchParams.roomId || ""} />

                {activeStep !== "finish" ? (
                 <>
                {/* Details Form */}
                <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-6 shadow-sm">
                   <div>
                      <h2 className="text-xl font-bold mb-2">Nhập thông tin chi tiết của bạn</h2>
                      <div className="bg-rose-50 p-3 rounded border border-rose-200 flex gap-3 text-[13px]">
                         <Info className="h-5 w-5 text-rose-500 shrink-0" />
                         <p>Gần xong rồi! Chỉ cần điền phần thông tin * bắt buộc. Vui lòng nhập thông tin của bạn bằng ký tự Latin để chỗ nghỉ có thể hiểu được.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-sm font-bold">Họ (tiếng Anh)*</label>
                         <input name="lastName" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-rose-600 outline-none" defaultValue={lastName} required />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold">Tên (tiếng Anh)*</label>
                         <input name="firstName" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-rose-600 outline-none" defaultValue={firstName} required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-sm font-bold">Địa chỉ email*</label>
                         <input name="email" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-rose-600 outline-none" defaultValue={email} required />
                         <p className="text-[11px] text-zinc-500">Email xác nhận đặt phòng sẽ được gửi đến địa chỉ này</p>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold">Vùng/quốc gia*</label>
                          <select name="country" defaultValue={country} className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-rose-600 outline-none bg-white">
                            <option value="Việt Nam">Việt Nam</option>
                            <option value="Singapore">Singapore</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold">Số điện thoại*</label>
                         <div className="flex gap-2">
                            <div className="w-24 border border-zinc-300 rounded px-2 py-2 text-sm flex items-center justify-between text-zinc-600 bg-zinc-50">+84</div>
                            <input
                              name="phone"
                              type="tel"
                              inputMode="tel"
                              autoComplete="off"
                              className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-rose-600 outline-none"
                              defaultValue={phone}
                              placeholder="Nhập số điện thoại"
                              required
                            />
                         </div>
                         <p className="text-[11px] text-zinc-500">Để xác minh đơn đặt và để chỗ nghỉ liên lạc khi cần</p>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-zinc-100">
                      <p className="text-sm font-bold">Bạn đặt phòng cho ai?</p>
                      <div className="space-y-3">
                         <label className="flex items-center gap-3 text-sm cursor-pointer">
                            <input type="radio" name="bookingFor" value="self" defaultChecked className="h-4 w-4 text-rose-600" />
                            Tôi là khách lưu trú chính
                         </label>
                         <label className="flex items-center gap-3 text-sm cursor-pointer">
                            <input type="radio" name="bookingFor" value="other" className="h-4 w-4 text-rose-600" />
                            Đặt phòng này là cho người khác
                         </label>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-zinc-100">
                      <p className="text-sm font-bold">Bạn sắp đi công tác?</p>
                      <div className="flex gap-8">
                         <label className="flex items-center gap-3 text-sm cursor-pointer">
                            <input type="radio" name="business" value="yes" className="h-4 w-4 text-rose-600" />
                            Đúng
                         </label>
                         <label className="flex items-center gap-3 text-sm cursor-pointer">
                            <input type="radio" name="business" value="no" defaultChecked className="h-4 w-4 text-rose-600" />
                            Sai
                         </label>
                      </div>
                   </div>
                </div>

                {/* Mách nhỏ Box */}
                <div className="bg-rose-50 rounded-lg border border-rose-200 p-4 flex gap-3">
                   <Info className="h-5 w-5 text-rose-600" />
                   <div>
                      <p className="text-sm font-bold text-rose-700">Mách nhỏ:</p>
                      <p className="text-[13px] text-rose-800">Không cần thẻ tín dụng. Không cần trả tiền ngay. Bạn sẽ thanh toán tại chỗ nghỉ.</p>
                   </div>
                </div>

                {/* Special Requests */}
                <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4 shadow-sm">
                   <h2 className="text-xl font-bold">Các Yêu Cầu Đặc Biệt</h2>
                   <p className="text-[13px] text-zinc-600">Các yêu cầu đặc biệt không đảm bảo sẽ được đáp ứng – tuy nhiên, chỗ nghỉ sẽ cố gắng hết sức để thực hiện. Bạn luôn có thể gửi yêu cầu đặc biệt sau khi hoàn tất đặt phòng của mình!</p>
                   <div className="space-y-2">
                      <label className="text-sm font-bold">Vui lòng ghi yêu cầu của bạn tại đây.(không bắt buộc)</label>
                      <textarea name="specialRequests" className="w-full border border-zinc-300 rounded p-3 text-sm focus:ring-1 focus:ring-rose-600 min-h-[120px] outline-none" />
                   </div>
                </div>

                {/* Arrival Time */}
                <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-4 shadow-sm">
                   <h2 className="text-xl font-bold">Thời gian đến của bạn</h2>
                   <div className="flex items-start gap-3 text-sm">
                      <Clock3 className="h-5 w-5 text-zinc-500 mt-0.5" />
                      <div>
                         <p>Phòng của bạn sẽ sẵn sàng để nhận trong khoảng từ 14:00 đến 00:00</p>
                         <p className="text-zinc-500 text-[13px] mt-1">Lễ tân 24 giờ - Luôn có trợ giúp mỗi khi bạn cần!</p>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold">Thêm thời gian đến dự kiến của bạn(không bắt buộc)</label>
                      <select name="arrivalTime" className="w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-rose-600 outline-none bg-white">
                         <option value="">Vui lòng chọn</option>
                         <option value="14:00 - 15:00">14:00 - 15:00</option>
                         <option value="15:00 - 16:00">15:00 - 16:00</option>
                         <option value="16:00 - 17:00">16:00 - 17:00</option>
                         <option value="17:00 - 18:00">17:00 - 18:00</option>
                         <option value="18:00 - 19:00">18:00 - 19:00</option>
                         <option value="19:00 - 20:00">19:00 - 20:00</option>
                         <option value="20:00 - 21:00">20:00 - 21:00</option>
                         <option value="21:00 - 22:00">21:00 - 22:00</option>
                         <option value="22:00 - 23:00">22:00 - 23:00</option>
                         <option value="23:00 - 00:00">23:00 - 00:00</option>
                         <option value="00:00 - 01:00">00:00 - 01:00</option>
                         <option value="01:00 - 02:00">01:00 - 02:00</option>
                         <option value="02:00 - 06:00">02:00 - 06:00</option>
                         <option value="06:00 - 10:00">06:00 - 10:00</option>
                         <option value="Tôi chưa biết">Tôi chưa biết</option>
                      </select>
                      <p className="text-[11px] text-zinc-500">Thời gian theo múi giờ của Đà Lạt</p>
                   </div>
                </div>

                <div className="flex justify-end pt-4">
                   <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-10 py-3 rounded-md text-lg shadow-lg hover:shadow-rose-200 transition-all active:scale-[0.98]">
                      Tiếp theo: Chi tiết cuối cùng
                   </button>
                </div>
                </>
                ) : (
                <>
                  <input type="hidden" name="firstName" value={firstName} />
                  <input type="hidden" name="lastName" value={lastName} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="phone" value={phone} />
                  <input type="hidden" name="country" value={country} />
                  <input type="hidden" name="paymentMethod" value={canPayAtProperty ? "pay_at_property" : "visa"} />
                  
                  {/* Step 3: Hoàn tất đặt phòng */}
                  {canPayAtProperty ? (
                    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                      <div className="flex items-start gap-5">
                        <div className="flex-1">
                          <h2 className="mb-3 text-xl font-bold">Không yêu cầu thông tin thanh toán</h2>
                          <p className="text-[15px] leading-7 text-zinc-800">
                            Thanh toán của bạn sẽ do <span className="font-bold">{property.title}</span> xử lý, nên bạn không cần nhập thông tin thanh toán cho đơn đặt này.
                          </p>
                        </div>
                        <div className="hidden rounded-lg bg-rose-50 p-4 sm:block">
                          <CreditCard className="h-10 w-10 text-rose-600" />
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-xl font-bold">Bạn muốn thanh toán bằng cách nào?</h2>
                    <div className={cn(
                      "grid gap-4",
                      canPayAtProperty ? "sm:grid-cols-2" : "sm:grid-cols-1",
                    )}>
                      <label className="group relative cursor-pointer rounded-lg border-2 border-zinc-200 bg-white p-4 shadow-sm transition hover:border-rose-300 hover:shadow-md has-[:checked]:border-rose-600">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="visa"
                          defaultChecked
                          className="peer absolute left-4 top-4 h-5 w-5 accent-rose-600"
                        />
                        <div className="flex min-h-28 flex-col items-center justify-center gap-3 px-4 pt-4">
                          <span className="text-4xl font-black italic tracking-tight text-[#1a1f71]">VISA</span>
                          <span className="text-sm font-semibold text-zinc-700">Thanh toán bằng thẻ Visa</span>
                        </div>
                      </label>

                      {canPayAtProperty && (
                        <label className="group relative cursor-pointer rounded-lg border-2 border-zinc-200 bg-white p-4 shadow-sm transition hover:border-rose-300 hover:shadow-md has-[:checked]:border-rose-600">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pay_at_property"
                            className="peer absolute left-4 top-4 h-5 w-5 accent-rose-600"
                          />
                          <div className="flex min-h-28 flex-col items-center justify-center gap-3 px-4 pt-4 text-center">
                            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                              <Hotel className="h-9 w-9 text-rose-600" />
                            </div>
                            <span className="text-sm font-semibold text-zinc-700">Thanh toán tại khách sạn</span>
                          </div>
                        </label>
                      )}
                    </div>

                    {!canPayAtProperty && (
                      <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
                        Chỗ nghỉ này yêu cầu thanh toán trước, vì vậy hiện chỉ hỗ trợ thanh toán bằng Visa.
                      </p>
                    )}

                    <div className="mt-6 rounded-lg bg-zinc-50 p-4">
                      <h3 className="mb-3 text-base font-bold">Thông tin thẻ</h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold">Tên chủ thẻ *</label>
                          <input
                            name="cardHolder"
                            defaultValue={`${firstName} ${lastName}`.trim()}
                            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-600"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-bold">Số thẻ *</label>
                          <div className="flex items-center gap-2 rounded border border-zinc-300 bg-white px-3 py-2">
                            <CreditCard className="h-5 w-5 text-zinc-500" />
                            <input
                              name="cardNumber"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              placeholder="•••• •••• •••• ••••"
                              className="w-full text-sm outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold">Ngày hết hạn *</label>
                          <input
                            name="cardExpiry"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            placeholder="MM / YY"
                            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-rose-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold">CVC *</label>
                          <div className="flex items-center gap-2 rounded border border-zinc-300 bg-white px-3 py-2">
                            <CreditCard className="h-5 w-5 text-zinc-500" />
                            <input
                              name="cardCvc"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              className="w-full text-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      {canPayAtProperty && (
                        <p className="mt-3 text-[12px] text-zinc-500">
                          Nếu chọn thanh toán tại khách sạn, bạn không cần nhập thông tin thẻ.
                        </p>
                      )}
                    </div>
                  </div>
                  )}

                  <div className="space-y-4">
                     <p className="text-[13px] text-zinc-700 leading-relaxed">
                        Đặt phòng của bạn là đặt phòng trực tiếp với <span className="font-bold">{property.title}</span> và bằng việc hoàn tất đặt phòng này, bạn đồng ý với <a href="#" className="text-rose-600 font-bold hover:underline">điều kiện đặt phòng</a>, <a href="#" className="text-rose-600 font-bold hover:underline">điều khoản chung</a> và <a href="#" className="text-rose-600 font-bold hover:underline">chính sách bảo mật</a>.
                     </p>

                     {bookingError && bookingErrorMessages[bookingError] ? (
                       <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
                         {bookingErrorMessages[bookingError]}
                       </p>
                     ) : null}

                     <div className="flex justify-end pt-2">
                        <CheckoutSubmitButton />
                     </div>

                     <div className="flex justify-end">
                       <a href="#" className="text-[13px] text-rose-600 font-bold hover:underline">Các điều kiện đặt phòng là gì?</a>
                     </div>
                  </div>
                </>
                )}
              </form>
          </main>
        </div>
      </div>
    </div>
  );
}
