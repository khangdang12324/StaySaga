"use client";

import React, { useState } from "react";
import {
  X,
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronRight,
  Info,
  Calendar,
  MapPin,
  ShieldAlert,
  ArrowLeft,
  ChevronDown,
  Search,
  ClipboardList,
  FileText,
  DollarSign,
  Pencil,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { format } from "date-fns";
import toast from "react-hot-toast";

type HelpClientProps = {
  bookings: any[];
  initialBookingId: string;
  lang: string;
  currency: string;
  userEmail?: string;
  userFullName?: string;
};

export default function HelpClient({
  bookings,
  initialBookingId,
  lang,
  currency,
  userEmail,
  userFullName,
}: HelpClientProps) {
  const t = (vi: string, en: string) => (lang === "EN" ? en : vi);

  const [selectedBookingId, setSelectedBookingId] = useState(
    initialBookingId || bookings[0]?.id || "",
  );
  const [showWarning, setShowWarning] = useState(true);
  const [detailText, setDetailText] = useState("");
  const [submittedText, setSubmittedText] = useState("");
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  const activeBooking = bookings.find((b) => b.id === selectedBookingId);

  const faqs = [
    {
      q: t("Làm thế nào để đặt phòng?", "How do I book a stay?"),
      a: t(
        "Chọn chỗ ở yêu thích, chọn ngày nhận/trả phòng và số khách, sau đó nhấn 'Đặt phòng ngay' và hoàn tất thanh toán.",
        "Choose your favorite stay, select check-in/out dates and number of guests, then click 'Book Now' and complete payment.",
      ),
    },
    {
      q: t(
        "Chính sách hủy phòng như thế nào?",
        "What is the cancellation policy?",
      ),
      a: t(
        "Mỗi chỗ ở có chính sách hủy riêng. Bạn có thể xem chi tiết tại trang thông tin của chỗ ở trước khi đặt phòng.",
        "Each property has its own cancellation policy. You can view the details on the property information page before booking.",
      ),
    },
    {
      q: t(
        "Tôi có thể thay đổi ngày đặt phòng không?",
        "Can I change my booking dates?",
      ),
      a: t(
        "Bạn có thể liên hệ chủ nhà hoặc bộ phận hỗ trợ để thay đổi ngày. Tùy thuộc vào tình trạng phòng trống.",
        "You can contact the host or customer support to change dates, subject to room availability.",
      ),
    },
    {
      q: t(
        "Phương thức thanh toán nào được chấp nhận?",
        "What payment methods are accepted?",
      ),
      a: t(
        "StaySaga hỗ trợ thanh toán qua Thẻ tín dụng/ghi nợ (Visa, Mastercard), VNPay, MoMo và chuyển khoản ngân hàng.",
        "StaySaga supports payment via Credit/Debit cards (Visa, Mastercard), VNPay, MoMo, and bank transfers.",
      ),
    },
    {
      q: t("Làm sao để trở thành Host (Chủ nhà)?", "How do I become a Host?"),
      a: t(
        "Đăng nhập vào tài khoản, vào mục 'Quản lý chỗ ở' trong menu và nhấn 'Đăng chỗ ở mới'.",
        "Log into your account, go to the 'Manage properties' section in the menu, and click 'List new property'.",
      ),
    },
  ];

  const handleNextAction = () => {
    if (!detailText.trim()) return;
    setSubmittedText(detailText.trim());
    setDetailText("");
  };

  const selectedBookingCheckIn = activeBooking?.check_in_date
    ? new Date(activeBooking.check_in_date)
    : null;
  const selectedBookingCheckOut = activeBooking?.check_out_date
    ? new Date(activeBooking.check_out_date)
    : null;

  const formattedDates = (checkIn: Date | null, checkOut: Date | null) => {
    if (!checkIn || !checkOut) return "";
    return lang === "EN"
      ? `${format(checkIn, "EEE d MMM")} – ${format(checkOut, "EEE d MMM")}`
      : `Thứ ${format(checkIn, "i") === "1" ? "Nhật" : Number(format(checkIn, "i")) + 1} ${format(checkIn, "d")} thg ${format(checkIn, "M")} – Thứ ${format(checkOut, "i") === "1" ? "Nhật" : Number(format(checkOut, "i")) + 1} ${format(checkOut, "d")} thg ${format(checkOut, "M")}`;
  };

  // Help options with matching icons from the Booking.com screenshot
  const helpOptions = [
    {
      icon: <ClipboardList className="w-5 h-5 text-slate-500" />,
      label: t("Quản lý đơn đặt", "Manage booking"),
      href: `/bookings/${activeBooking?.id}`,
    },
    {
      icon: <FileText className="w-5 h-5 text-slate-500" />,
      label: t("Xem chi tiết đặt phòng", "View booking details"),
      href: `/bookings/${activeBooking?.id}`,
    },
    {
      icon: <DollarSign className="w-5 h-5 text-slate-500" />,
      label: t("Xem thông tin thanh toán", "View payment details"),
      href: `/bookings/${activeBooking?.id}`,
    },
    {
      icon: <Pencil className="w-5 h-5 text-slate-500" />,
      label: t("Chỉnh sửa đặt phòng", "Edit booking"),
      href: `/bookings/${activeBooking?.id}`,
    },
    {
      icon: <Calendar className="w-5 h-5 text-slate-500" />,
      label: t("Thay đổi ngày đặt", "Change stay dates"),
      href: `/bookings/${activeBooking?.id}`,
    },
    {
      icon: <Plus className="w-5 h-5 text-slate-500" />,
      label: t("Kiểm tra tiện nghi", "Check amenities"),
      href: `/bookings/${activeBooking?.id}`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Premium StaySaga Header */}
      <header className="bg-rose-600 pt-3.5 pb-3.5 shadow-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-white text-2xl font-black tracking-tight select-none"
          >
            StaySaga
          </Link>
          <div className="flex items-center gap-3 text-white text-sm font-bold">
            <Link
              href="/bookings"
              className="hover:bg-rose-700 p-2 px-3 rounded-lg cursor-pointer transition-colors text-white"
            >
              {t("Chuyến đi của tôi", "My Trips")}
            </Link>
            <div className="hover:bg-rose-700 p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center">
              {lang === "VN" ? (
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border border-red-700">
                  <span className="text-yellow-400 text-[10px] leading-none">
                    ★
                  </span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center border border-rose-700 overflow-hidden relative">
                  <div className="absolute w-full h-1 bg-red-600 top-1/2 -translate-y-1/2 z-10" />
                  <div className="absolute h-full w-1 bg-red-600 left-1/2 -translate-x-1/2 z-10" />
                  <div className="absolute w-full h-2 bg-white top-1/2 -translate-y-1/2 z-0" />
                  <div className="absolute h-full w-2 bg-white left-1/2 -translate-x-1/2 z-0" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Support Workspace */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 font-semibold">
          <Link
            href="/"
            className="text-rose-650 hover:text-rose-750 transition-colors"
          >
            {t("Trang chủ", "Home")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link
            href="/help"
            className="text-rose-650 hover:text-rose-750 transition-colors"
          >
            {t("Trung tâm trợ giúp", "Customer Service")}
          </Link>
          {activeBooking && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 truncate">
                {t("Yêu cầu về đơn đặt phòng", "Reservation Help")}
              </span>
            </>
          )}
        </div>

        {/* Security / Always Safe Online Warning banner */}
        {showWarning && (
          <div className="bg-white border-2 border-amber-500 rounded-xl p-5 shadow-sm relative overflow-hidden mb-6 flex gap-4 items-start">
            <button
              onClick={() => setShowWarning(false)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <div className="bg-amber-100 rounded-full p-2 shrink-0 text-amber-600 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
              <h4 className="font-extrabold text-slate-900 mb-1">
                {t("Luôn an toàn online", "Always safe online")}
              </h4>
              <p>
                {t(
                  "Vui lòng xem chính sách thanh toán của bạn. StaySaga tuyệt đối không yêu cầu bạn cung cấp thông tin tài khoản hoặc thông tin thanh toán qua điện thoại, email hay dịch vụ chat (ví dụ như WhatsApp). Nếu bạn có điều gì nghi ngờ, vui lòng báo ngay cho chúng tôi.",
                  "Please check your payment policy. StaySaga will never ask you to provide account or payment details via phone, email, or chat services (such as WhatsApp). If you have any suspicions, please report them to us immediately.",
                )}
              </p>
            </div>
          </div>
        )}

        {/* Support Selection Dropdown / Selector if logged in and has bookings */}
        {bookings.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                {t(
                  "Đơn đặt phòng đang được hỗ trợ:",
                  "Booking you need help with:",
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  "Chọn đơn đặt phòng của bạn bên dưới để nhận trợ giúp phù hợp.",
                  "Select your reservation below to receive specific support.",
                )}
              </p>
            </div>
            <div className="relative min-w-[200px]">
              <select
                value={selectedBookingId}
                onChange={(e) => {
                  setSelectedBookingId(e.target.value);
                  setSubmittedText("");
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 cursor-pointer appearance-none shadow-sm pr-8"
              >
                <option value="">
                  -- {t("Chọn đặt phòng", "Select booking")} --
                </option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.homestay?.name || b.homestay?.city || "StaySaga Stay"} (
                    {(b.booking_code || b.id).slice(0, 8).toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 1. RESERVATION HELP FLOW (If booking selected) */}
        {activeBooking ? (
          <div className="space-y-6">
            {/* Homestay summary info card + submitted search text */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Booking card row */}
              <div className="p-5 flex items-start sm:items-center gap-4 relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden relative shrink-0 border border-slate-100 bg-slate-50">
                  <SafeImage
                    src={
                      activeBooking.homestay?.homestay_images?.[0]?.url ||
                      "/images/fallback-hotel.jpg"
                    }
                    alt={activeBooking.homestay?.name || "Homestay"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate">
                    {activeBooking.homestay?.name || "StaySaga Stay"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {formattedDates(
                      selectedBookingCheckIn,
                      selectedBookingCheckOut,
                    )}
                  </p>
                </div>
                <button
                  onClick={() =>
                    (window.location.href = `/bookings/${activeBooking.id}`)
                  }
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
                  title={t("Xem chi tiết", "View details")}
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              {/* Submitted search text display (below booking card, inside same card) */}
              {submittedText && (
                <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-800">
                      {submittedText}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input search textarea section - "Chúng tôi có thể giúp gì cho bạn?" */}
            {!submittedText ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-2">
                  {t(
                    "Chúng tôi có thể giúp gì cho bạn?",
                    "How can we help you?",
                  )}
                </h2>
                <p className="text-xs text-slate-450 font-semibold mb-4 leading-relaxed">
                  {t(
                    "Mô tả câu hỏi hoặc yêu cầu cụ thể của bạn.",
                    "Describe your question or specific request.",
                  )}
                </p>

                <div className="space-y-4">
                  <textarea
                    rows={3}
                    value={detailText}
                    onChange={(e) => setDetailText(e.target.value)}
                    placeholder={t(
                      "Thêm vài chi tiết để giúp chúng tôi biết mình nên làm gì tiếp theo...",
                      "Add details to help us know what to do next...",
                    )}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
                  />

                  <button
                    onClick={handleNextAction}
                    disabled={!detailText.trim()}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold shadow-sm transition-all text-center flex items-center justify-center cursor-pointer ${
                      detailText.trim()
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {t("Tiếp theo", "Next")}
                  </button>
                </div>
              </div>
            ) : null}

            {/* "Những điều bạn có thể làm" - Options checklist with icons */}
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-1">
                {t("Những điều bạn có thể làm", "Things you can do")}
              </h2>
              <p className="text-xs text-slate-450 font-semibold mb-4 leading-relaxed">
                {t(
                  "Chọn 1 trong những lựa chọn dưới đây và chúng tôi sẽ hướng dẫn bạn bước kế tiếp.",
                  "Select an option below and we'll guide you through the next steps.",
                )}
              </p>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
                {helpOptions.map((option, i) => (
                  <Link
                    key={i}
                    href={option.href}
                    className="flex items-center justify-between py-4 px-6 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="shrink-0">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </Link>
                ))}

                {/* Chủ đề khác - with ••• icon */}
                <button
                  onClick={() => {
                    const contactsEl =
                      document.getElementById("support-contacts");
                    if (contactsEl) {
                      contactsEl.scrollIntoView({ behavior: "smooth" });
                      toast.success(
                        t(
                          "Vui lòng liên hệ trực tiếp với chúng tôi qua các phương thức bên dưới.",
                          "Please reach out via support channels below.",
                        ),
                      );
                    }
                  }}
                  className="flex items-center justify-between w-full text-left py-4 px-6 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <MoreHorizontal className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>{t("Chủ đề khác", "Other topics")}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 2. GENERAL FAQ PORTAL (If no booking active or guest) */
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-2">
                {t("Chúng tôi có thể giúp gì cho bạn?", "How can we help you?")}
              </h2>
              <p className="text-xs text-slate-450 font-semibold mb-6">
                {t(
                  "Tìm kiếm nhanh câu trả lời hoặc chọn một đặt phòng của bạn ở trên để nhận hỗ trợ cụ thể.",
                  "Find answers to frequently asked questions or select a booking above to receive customized help.",
                )}
              </p>

              <div className="space-y-3">
                {faqs.map((faq, i) => {
                  const isOpen = faqOpenIndex === i;
                  return (
                    <div
                      key={i}
                      className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs hover:border-slate-200 transition-colors"
                    >
                      <button
                        onClick={() => setFaqOpenIndex(isOpen ? null : i)}
                        className="w-full text-left flex items-center justify-between px-5 py-4 font-bold text-sm text-slate-900 cursor-pointer hover:bg-slate-50/50"
                      >
                        <span>{faq.q}</span>
                        <ChevronRight
                          className={`w-4 h-4 text-slate-450 transition-transform ${isOpen ? "rotate-90 text-rose-500" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Help Contacts Segment */}
        <div
          id="support-contacts"
          className="mt-8 pt-8 border-t border-slate-200"
        >
          <h2 className="text-lg font-black text-slate-900 mb-4">
            {t("Liên hệ với StaySaga", "Contact StaySaga Support")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                if (activeBooking) {
                  window.location.href = `/messages?bookingId=${activeBooking.id}`;
                } else {
                  window.location.href = `/messages`;
                }
              }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-200 transition-all cursor-pointer flex gap-4 items-start"
            >
              <div className="bg-rose-50 rounded-xl p-2.5 shrink-0 text-rose-500">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-0.5">
                  {t("Chat trực tuyến", "Live Chat")}
                </h3>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  {t(
                    "Trò chuyện và nhận câu trả lời nhanh từ chúng tôi hoặc chủ nhà 24/7.",
                    "Message us or property host directly for 24/7 support.",
                  )}
                </p>
              </div>
            </div>

            <a
              href="mailto:support@staysaga.com"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-rose-200 transition-all flex gap-4 items-start"
            >
              <div className="bg-rose-50 rounded-xl p-2.5 shrink-0 text-rose-500">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 mb-0.5">
                  {t("Gửi email", "Email support")}
                </h3>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  support@staysaga.com <br />
                  {t(
                    "Đội ngũ kỹ thuật hỗ trợ giải đáp trong vòng 24h.",
                    "Our technical team will respond within 24 hours.",
                  )}
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
