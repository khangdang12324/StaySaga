"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Smartphone,
  Printer,
  Info,
  Copy,
  X,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MessageSquare,
  Users,
  MapPin,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  FileText,
  Map,
  MoreVertical,
  Loader2,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";
import { format, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import InvoiceModal from "./InvoiceModal";

type TripDetailClientProps = {
  booking: any;
  bookingsInCity?: any[];
  userEmail: string;
  userFullName?: string;
  userAvatar?: string;
  lang: string;
  currency: string;
  cancelAction: (
    bookingId: string,
  ) => Promise<{ success?: boolean; error?: string }>;
  rescheduleAction: (formData: FormData) => Promise<void>;
};

export default function TripDetailClient({
  booking,
  bookingsInCity = [],
  userEmail,
  userFullName = "User",
  userAvatar = "",
  lang,
  currency,
  cancelAction,
  rescheduleAction,
}: TripDetailClientProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSurvey, setShowSurvey] = useState(true);

  const [targetBooking, setTargetBooking] = useState<any>(booking);
  const [openMenuBookingId, setOpenMenuBookingId] = useState<string | null>(
    null,
  );

  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");

  const t = (vi: string, en: string) => (lang === "EN" ? en : vi);

  const formatPrice = (amount: number) => {
    if (currency === "USD") {
      return `USD ${(amount / 27000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `₫${amount.toLocaleString("vi-VN")}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(
      `${label} ${t("đã được sao chép vào bộ nhớ tạm", "copied to clipboard")}`,
    );
  };

  const listBookings = bookingsInCity.length > 0 ? bookingsInCity : [booking];

  const city =
    booking.homestay?.city || booking.homestay?.location || "TP. Hồ Chí Minh";
  const mainCheckIn = booking.check_in_date
    ? new Date(booking.check_in_date)
    : new Date();
  const mainCheckOut = booking.check_out_date
    ? new Date(booking.check_out_date)
    : new Date();

  const sortedDates = [...listBookings].sort((a: any, b: any) => {
    const aDate = a.check_in_date || "";
    const bDate = b.check_in_date || "";
    return aDate.localeCompare(bDate);
  });

  const earliestCheckIn = sortedDates[0]?.check_in_date
    ? new Date(sortedDates[0].check_in_date)
    : mainCheckIn;
  const latestCheckOut = sortedDates[sortedDates.length - 1]?.check_out_date
    ? new Date(sortedDates[sortedDates.length - 1].check_out_date)
    : mainCheckOut;

  const nights =
    booking.nights || differenceInDays(mainCheckOut, mainCheckIn) || 1;
  const displayCode =
    booking.booking_code ||
    booking.id?.toString().slice(0, 8).toUpperCase() ||
    "BK-123456";
  const pinCode = "7495";
  const imgUrl =
    booking.homestay?.homestay_images?.[0]?.url || "/images/fallback-hotel.jpg";
  const address = booking.homestay?.address || "Việt Nam";

  // Google Maps URL Resolution
  const mapsLat = booking.homestay?.latitude;
  const mapsLng = booking.homestay?.longitude;
  const mapsUrl =
    mapsLat && mapsLng
      ? `https://www.google.com/maps?q=${mapsLat},${mapsLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [
            booking.homestay?.name,
            booking.homestay?.address || booking.homestay?.city,
          ]
            .filter(Boolean)
            .join(", "),
        )}`;

  // Handle Cancellation Action
  async function handleCancelConfirm(e: React.FormEvent) {
    e.preventDefault();
    setIsCancelling(true);
    try {
      const res = await cancelAction(targetBooking.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          t("Hủy đặt phòng thành công!", "Booking cancelled successfully!"),
        );
        setShowCancelModal(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(
        t("Có lỗi xảy ra khi hủy.", "An error occurred during cancellation."),
      );
    } finally {
      setIsCancelling(false);
    }
  }

  const openRescheduleModal = (b: any) => {
    setTargetBooking(b);
    setNewCheckIn(b.check_in_date ? b.check_in_date.slice(0, 10) : "");
    setNewCheckOut(b.check_out_date ? b.check_out_date.slice(0, 10) : "");
    setShowRescheduleModal(true);
  };

  // Get status details (Badge labels and colors)
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return {
          label: t("Đã xác nhận", "Confirmed"),
          bg: "bg-emerald-55 text-emerald-700 border-emerald-100",
          desc: t(
            "Đơn đặt của bạn đã được chỗ nghỉ xác nhận.",
            "Your booking is confirmed by the property.",
          ),
        };
      case "PENDING":
        return {
          label: t("Đã xác nhận", "Confirmed"),
          bg: "bg-emerald-55 text-emerald-700 border-emerald-100",
          desc: t(
            "Đơn đặt của bạn đã được chỗ nghỉ xác nhận.",
            "Your booking is confirmed by the property.",
          ),
        };
      case "CANCELLED":
        return {
          label: t("Đã hủy", "Cancelled"),
          bg: "bg-red-50 text-red-600 border-red-100",
          desc: t(
            "Đơn đặt phòng này đã được hủy thành công.",
            "This booking has been successfully cancelled.",
          ),
        };
      case "COMPLETED":
        return {
          label: t("Đã hoàn tất", "Completed"),
          bg: "bg-rose-50 text-rose-700 border-rose-100",
          desc: t(
            "Kỳ nghỉ của bạn đã hoàn tất. Cảm ơn bạn đã đồng hành cùng StaySaga!",
            "Your stay has completed. Thank you for choosing StaySaga!",
          ),
        };
      case "NO_SHOW":
        return {
          label: t("Không đến nhận phòng", "No Show"),
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          desc: t(
            "Bạn đã không đến nhận phòng như lịch đặt.",
            "You did not show up for your check-in.",
          ),
        };
      default:
        return {
          label: status,
          bg: "bg-slate-50 text-slate-700 border-slate-100",
          desc: "",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pt-24 pb-20 font-sans">
      {/* Dynamic Breadcrumbs */}
      <div className="py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Link
              href="/bookings"
              className="text-rose-600 hover:text-rose-750 font-bold transition-colors"
            >
              {t("Đặt chỗ & Chuyến đi", "Trips & Bookings")}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-medium truncate">{city}</span>
          </div>
          <Link
            href="/help"
            className="text-rose-600 hover:text-rose-750 font-semibold hover:underline transition-all"
          >
            {t("Bạn không tìm thấy đặt phòng?", "Can't find your booking?")}
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Cover Hero Banner */}
        <div className="h-48 sm:h-56 w-full relative rounded-xl overflow-hidden shadow-sm mb-6 border border-slate-200 animate-fade-in">
          <SafeImage
            src={getLocationImage(city)}
            alt={city}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center">
                {city}
              </h1>
              <button
                className="h-7 w-7 rounded-full bg-white flex items-center justify-center shadow hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer"
                aria-label="Edit destination"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[13px] sm:text-sm text-slate-200 font-bold mt-1.5">
              {lang === "EN"
                ? `${format(earliestCheckIn, "d MMM")} – ${format(latestCheckOut, "d MMM, yyyy")}`
                : `${format(earliestCheckIn, "d")} tháng ${format(earliestCheckIn, "M")} – ${format(latestCheckOut, "d")} tháng ${format(latestCheckOut, "M")}`}
            </p>
          </div>
        </div>

        {/* Booking Cards in City list */}
        {listBookings.map((b: any) => {
          const bHotelName =
            b.homestay?.name || b.homestay?.title || "StaySaga Homestay";
          const bCheckInDate = b.check_in_date
            ? new Date(b.check_in_date)
            : new Date();
          const bCheckOutDate = b.check_out_date
            ? new Date(b.check_out_date)
            : new Date();
          const bImgUrl =
            b.homestay?.homestay_images?.[0]?.url ||
            "/images/fallback-hotel.jpg";
          const bLat = b.homestay?.latitude;
          const bLng = b.homestay?.longitude;
          const bMapsUrl =
            bLat && bLng
              ? `https://www.google.com/maps?q=${bLat},${bLng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [b.homestay?.name, b.homestay?.address || b.homestay?.city]
                    .filter(Boolean)
                    .join(", "),
                )}`;

          return (
            <div
              key={b.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6"
            >
              {/* Main Hotel Info Row */}
              <div className="p-6 flex flex-col sm:flex-row gap-5 items-start relative">
                <div className="w-24 h-24 relative rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                  <SafeImage src={bImgUrl} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug hover:text-rose-600 transition-colors">
                    <Link href={`/bookings/success?bookingId=${b.id}`}>
                      {bHotelName}
                    </Link>
                  </h2>

                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 leading-relaxed font-semibold">
                    <span>
                      {lang === "EN"
                        ? `${format(bCheckInDate, "d MMM")} – ${format(bCheckOutDate, "d MMM, yyyy")}`
                        : `${format(bCheckInDate, "d")} tháng ${format(bCheckInDate, "M")} – ${format(bCheckOutDate, "d")} tháng ${format(bCheckOutDate, "M")}`}
                    </span>
                    <span>·</span>
                    <span>{city}</span>
                    <span>·</span>
                    <span className="text-emerald-700 font-bold">
                      {t("Miễn phí hủy phòng", "Free cancellation")}
                    </span>
                  </p>

                  <div className="mt-2.5">
                    {b.status === "CONFIRMED" || b.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-2 py-0.5 rounded">
                        {t("Đã xác nhận", "Confirmed")}
                      </span>
                    ) : b.status === "CANCELLED" ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-655 border border-red-100 text-xs font-bold px-2 py-0.5 rounded">
                        {t("Đã hủy", "Cancelled")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 text-xs font-bold px-2 py-0.5 rounded">
                        {t("Đã hoàn tất", "Completed")}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 mt-2.5 font-semibold">
                    {t("• Trả phòng:", "• Check-out:")}{" "}
                    {lang === "EN"
                      ? format(bCheckOutDate, "EEEE, d MMM")
                      : `Thứ ${format(bCheckOutDate, "i") === "1" ? "Nhật" : Number(format(bCheckOutDate, "i")) + 1}, ${format(bCheckOutDate, "d")} thg ${format(bCheckOutDate, "M")}`}{" "}
                    {t("trước 12:00", "before 12:00")}
                  </div>
                </div>

                {/* Price & Action dots aligned right */}
                <div className="flex flex-col items-end gap-1.5 self-stretch sm:self-auto shrink-0 mt-3 sm:mt-0 ml-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-slate-900">
                      {formatPrice(Number(b.total_price || 0))}
                    </span>

                    {/* Three dots Vertical Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuBookingId(
                            openMenuBookingId === b.id ? null : b.id,
                          )
                        }
                        className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer transition-colors active:bg-slate-200"
                        aria-label="More actions"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuBookingId === b.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuBookingId(null)}
                          />
                          <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 text-xs text-slate-700 animate-fade-in font-semibold">
                            {["PENDING", "CONFIRMED"].includes(b.status) && (
                              <button
                                onClick={() => {
                                  setOpenMenuBookingId(null);
                                  openRescheduleModal(b);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors"
                              >
                                {t(
                                  "Thay đổi ngày lưu trú",
                                  "Change stay dates",
                                )}
                              </button>
                            )}
                            {["PENDING", "CONFIRMED"].includes(b.status) && (
                              <button
                                onClick={() => {
                                  setOpenMenuBookingId(null);
                                  setTargetBooking(b);
                                  setShowCancelModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                {t("Hủy đặt phòng", "Cancel booking")}
                              </button>
                            )}
                            <Link
                              href="/help"
                              className="block px-4 py-2 hover:bg-slate-50 transition-colors"
                            >
                              {t("Hỏi trợ giúp", "Help & support")}
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions List inside the same card */}
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {/* 1. Request Invoice */}
                <button
                  onClick={() => {
                    setTargetBooking(b);
                    setShowInvoiceModal(true);
                  }}
                  className="flex items-center justify-between w-full text-left py-4 px-6 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{t("Yêu cầu hóa đơn", "Request invoice")}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>

                {/* 2. Directions */}
                <a
                  href={bMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full text-left py-4 px-6 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{t("Xem đường đi", "Get directions")}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </a>

                {/* 3. Chat */}
                <Link
                  href={`/messages?bookingId=${b.id}`}
                  className="flex items-center justify-between w-full text-left py-4 px-6 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>{t("Nhắn tin cho chỗ nghỉ", "Message host")}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </Link>

                {/* 4. Help / Customer support */}
                <Link
                  href="/help"
                  className="flex items-center justify-between w-full text-left py-4 px-6 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>
                      {t(
                        "Liên hệ Dịch vụ Khách hàng",
                        "Contact Customer Service",
                      )}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Questionnaire Survey Section */}
        {showSurvey && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex gap-5 items-start relative overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSurvey(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close survey"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Avatar Illustration */}
            <div className="hidden sm:block shrink-0 mt-1">
              <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="#FFE4E6" />
                <path
                  d="M48 48C48 39.1634 40.8366 32 32 32C23.1634 32 16 39.1634 16 48"
                  fill="#F43F5E"
                />
                <circle cx="32" cy="22" r="8" fill="#FDA4AF" />
                <circle cx="44" cy="20" r="7" fill="#F59E0B" />
                <text
                  x="41"
                  y="24"
                  fill="white"
                  fontSize="11"
                  fontWeight="black"
                  fontFamily="sans-serif"
                >
                  ?
                </text>
              </svg>
            </div>

            <div className="flex-1">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider block mb-1">
                {t("Câu 1/2", "Question 1/2")}
              </span>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                {t(
                  "Các chuyến đi của tôi được sắp xếp đúng như tôi mong đợi.",
                  "My trips are organized exactly as I expected.",
                )}
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
        )}
      </div>
      {/* Cancellation Warning Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 mb-2">
                {t("Hủy đặt phòng này?", "Cancel this booking?")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                {t(
                  "Bạn có chắc chắn muốn hủy đặt phòng này không? Hành động này không thể hoàn tác và trạng thái đặt chỗ sẽ đổi thành Đã hủy.",
                  "Are you sure you want to cancel this booking? This action cannot be undone and your booking status will be updated to Cancelled.",
                )}
              </p>

              <form
                onSubmit={handleCancelConfirm}
                className="flex justify-end gap-3 border-t border-slate-100 pt-4"
              >
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  {t("Bỏ qua", "Close")}
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:bg-rose-400"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("Đang hủy...", "Cancelling...")}
                    </>
                  ) : (
                    t("Xác nhận hủy", "Confirm Cancel")
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Stay Dates Dialog Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("Thay đổi ngày lưu trú", "Change stay dates")}
                </h3>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form action={rescheduleAction} className="space-y-4">
                <input type="hidden" name="bookingId" value={booking.id} />

                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                    {t("Ngày nhận phòng", "Check-in date")}
                  </label>
                  <input
                    type="date"
                    name="checkIn"
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                    {t("Ngày trả phòng", "Check-out date")}
                  </label>
                  <input
                    type="date"
                    name="checkOut"
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRescheduleModal(false)}
                    className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-650 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    {t("Đóng", "Close")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md"
                  >
                    {t("Cập nhật ngày", "Update Dates")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Request Modal popover */}
      {showInvoiceModal && (
        <InvoiceModal
          bookingId={booking.id}
          hostPhone={booking.homestay?.owner?.phone}
          hostEmail={booking.homestay?.owner?.email}
          onClose={() => setShowInvoiceModal(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
