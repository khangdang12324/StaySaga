"use client";

import { useState } from "react";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import SafeImage from "@/components/ui/SafeImage";

type PrintConfirmationButtonProps = {
  label: string;
  booking: any;
  messages: any[];
  lang: string;
  currency: string;
  userEmail: string;
  totalPrice: number;
  nights: number;
  displayCode: string;
  pinCode: string;
  dateLabel: string;
  mainImage: string;
  hotelName: string;
  city: string;
  startDateStr: string;
  endDateStr: string;
};

export default function PrintConfirmationButton({
  label,
  booking,
  messages,
  lang,
  currency,
  userEmail,
  totalPrice,
  nights,
  displayCode,
  pinCode,
  dateLabel,
  mainImage,
  hotelName,
  city,
  startDateStr,
  endDateStr,
}: PrintConfirmationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeMessages, setIncludeMessages] = useState(false);
  const [includePolicies, setIncludePolicies] = useState(false);

  const t = (vi: string, en: string) => (lang === "EN" ? en : vi);

  const formatCurrency = (amount: number) => {
    if (currency === "USD") {
      return `USD ${(amount / 27000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `VND ${amount.toLocaleString("vi-VN")}`;
  };

  const handlePrint = () => {
    setIsOpen(false);
    // Let React finish closing the modal and updating classes, then print
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const guestName = booking?.user_full_name || booking?.guest_name || userEmail.split("@")[0] || "Carl Williams";
  const guestPhone = booking?.homestay?.owner?.phone || "+84 28 3622 5811";
  const formattedCheckIn = startDateStr ? format(new Date(startDateStr), "EEE, dd MMM yyyy") : "";
  const formattedCheckOut = endDateStr ? format(new Date(endDateStr), "EEE, dd MMM yyyy") : "";

  return (
    <>
      <style>{`
        #booking-print-document {
          display: none;
        }

        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          #booking-print-document,
          #booking-print-document * {
            visibility: visible !important;
          }

          #booking-print-document {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
          }

          .print-card {
            break-inside: avoid;
          }

          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
      >
        <Printer className="w-4 h-4" />
        {label}
      </button>

      {/* Print Selection Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 p-6 relative">
            
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <h3 className="text-lg font-extrabold text-slate-900 mb-6 pr-6">
              {t("Tích vào mục Quý vị muốn in", "Select the sections you want to print")}
            </h3>

            {/* Checkbox Options */}
            <div className="space-y-5 mb-6">
              {/* Option 1: Details */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="mt-1 h-4.5 w-4.5 rounded border-slate-350 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {t("Chi tiết đặt phòng", "Booking details")}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-semibold">
                    {t(
                      "Bao gồm tên khách, tổng số khách, tổng giá tiền, phụ phí và chi tiết thời gian đi và đến.",
                      "Includes guest name, total guests, total price, additional fees, and details of arrival/departure times."
                    )}
                  </p>
                </div>
              </label>

              {/* Option 2: Messages */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeMessages}
                  onChange={(e) => setIncludeMessages(e.target.checked)}
                  className="mt-1 h-4.5 w-4.5 rounded border-slate-350 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {t("Tin nhắn", "Messages")}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-semibold">
                    {t(
                      "Tin nhắn giữa Quý vị và khách.",
                      "Chat history between you and the guest."
                    )}
                  </p>
                </div>
              </label>

              {/* Option 3: Policies */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includePolicies}
                  onChange={(e) => setIncludePolicies(e.target.checked)}
                  className="mt-1 h-4.5 w-4.5 rounded border-slate-350 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {t("Chính sách", "Policies")}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-semibold">
                    {t(
                      "Thông tin về chính sách của đặt phòng này bao gồm hủy đặt phòng và thanh toán trước.",
                      "Information about the policies of this booking, including cancellation and pre-payment details."
                    )}
                  </p>
                </div>
              </label>
            </div>

            {/* Tip section */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 font-semibold mb-6">
              {t(
                "Mẹo: nhấn tổ hợp phím CTRL+P nếu Quý vị muốn in hết tất cả các thông tin đặt phòng.",
                "Tip: press CTRL+P keyboard shortcut if you wish to print all booking information directly."
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                {t("Hủy", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-2 rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                {t("In", "Print")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Hidden Printed Document Rendered ONLY for window.print() */}
      <section id="booking-print-document" className="hidden print:block absolute inset-0 w-full text-zinc-900 font-sans p-6" aria-hidden="true">
        
        {/* Header Section */}
        <div className="border-b-[6px] border-rose-600 pb-4 mb-6">
          <div className="flex justify-between items-start gap-6">
            <div>
              <div className="text-rose-600 text-3xl font-black tracking-tighter">StaySaga</div>
              <div className="mt-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                {t("Đã xác nhận", "Confirmed")}
              </div>
              <h1 className="margin-0 mt-1 text-2xl font-black text-slate-900">
                {t("Chi tiết đặt phòng", "Booking Details")}
              </h1>
            </div>
            <div className="border border-rose-100 bg-rose-50/50 rounded-xl p-3.5 min-w-[200px] text-right">
              <div className="text-[10px] text-slate-555 font-bold uppercase tracking-wider">{t("Mã số đặt phòng", "Booking ID")}</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{displayCode}</div>
              <div className="text-[10px] text-slate-555 font-bold uppercase tracking-wider mt-2.5">{t("Mã PIN", "PIN Code")}</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{pinCode}</div>
            </div>
          </div>
        </div>

        {/* 1. Details print card */}
        {includeDetails && (
          <div id="print-section-details" className="space-y-6">
            
            {/* Homestay details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 flex bg-white">
              <div className="relative w-44 h-32 shrink-0 bg-slate-100 border-r border-slate-200">
                <SafeImage src={mainImage} alt={hotelName} fill className="object-cover" />
              </div>
              <div className="p-4 flex-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t("Chỗ nghỉ", "Property")}</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{hotelName}</h2>
                <div className="text-xs text-slate-650 mt-1">{city}, Việt Nam</div>
                <div className="mt-3.5 text-xs text-slate-800 font-medium">
                  {t("Tên khách:", "Guest name:")} <strong className="font-bold text-slate-900">{guestName}</strong>
                </div>
                <div className="text-xs text-slate-800 font-medium mt-1">
                  {t("Email khách:", "Guest email:")} <strong className="font-bold text-slate-900">{userEmail}</strong>
                </div>
              </div>
            </div>

            {/* Check-in / Check-out Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="text-xs text-slate-500 font-bold uppercase">{t("Nhận phòng", "Check-in")}</div>
                <div className="text-base font-black text-slate-955 mt-1">{formattedCheckIn}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">14:00 - 00:00</div>
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="text-xs text-slate-500 font-bold uppercase">{t("Trả phòng", "Check-out")}</div>
                <div className="text-base font-black text-slate-955 mt-1">{formattedCheckOut}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">00:00 - 12:00</div>
              </div>
            </div>

            {/* Stays info details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                [t("Thời gian lưu trú", "Length of stay"), `${nights} ${t("đêm", "nights")}`],
                [t("Số lượng phòng", "Number of rooms"), `1 ${t("phòng", "room")}`],
                [t("Tổng giá phòng", "Total room price"), formatCurrency(totalPrice)],
              ].map(([label, val]) => (
                <div key={label} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
                  <div className="text-base font-black text-slate-955 mt-1">{val}</div>
                </div>
              ))}
            </div>

            {/* Price details table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-655 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">{t("Chi tiết giá", "Price breakdown")}</th>
                    <th className="py-2.5 px-4 text-right">{t("Số tiền", "Amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-4">{t("1 Phòng x Giường Superior", "1 Room x Superior Bed")}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(totalPrice * 0.91)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">{t("10% Thuế GTGT (VAT)", "10% Value Added Tax (VAT)")}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(totalPrice * 0.09)}</td>
                  </tr>
                  <tr className="bg-rose-50/45 font-bold text-rose-700 text-sm">
                    <td className="py-3 px-4">{t("Tổng cộng (đã gồm Thuế)", "Total (incl. tax)")}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(totalPrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 2. Messages print card */}
        {includeMessages && (
          <div id="print-section-messages" className="page-break-before mt-8">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-2 mb-4">
              {t("Lịch sử tin nhắn giữa chỗ nghỉ & khách", "Message history between property & guest")}
            </h3>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg, index) => {
                  const isUser = msg.sender_role === "USER";
                  const isPartner = msg.sender_role === "PARTNER";
                  const senderName = isUser ? guestName : (isPartner ? hotelName : t("Hệ thống", "System"));
                  
                  return (
                    <div key={msg.id || index} className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1.5 uppercase">
                        <span>{senderName}</span>
                        <span>{format(new Date(msg.created_at), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-550 italic py-4">
                {t("Không có lịch sử tin nhắn nào được ghi nhận.", "No message logs found.")}
              </p>
            )}
          </div>
        )}

        {/* 3. Policies print card */}
        {includePolicies && (
          <div id="print-section-policies" className="page-break-before mt-8">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-2 mb-4">
              {t("Chính sách lưu trú & Quy định chung", "Accommodation policies & General rules")}
            </h3>
            
            <div className="border border-slate-200 rounded-xl p-4 space-y-4 text-xs leading-relaxed text-slate-700 bg-white">
              <div>
                <strong className="font-extrabold text-slate-900 block mb-1">{t("1. Chính sách hủy đặt phòng", "1. Cancellation Policy")}</strong>
                <p className="text-emerald-700 font-semibold">{t("✓ Miễn phí hủy phòng", "✓ Free cancellation")}</p>
                <p className="text-slate-500 mt-0.5">{t("Khách hàng có thể thực hiện hủy phòng trực tuyến miễn phí trước thời gian quy định nhận phòng mà không mất phí.", "Guests can cancel this booking online free of charge before the check-in date.")}</p>
              </div>
              
              <div>
                <strong className="font-extrabold text-slate-900 block mb-1">{t("2. Chính sách thanh toán trước", "2. Prepayment Policy")}</strong>
                <p>{t("Không cần thanh toán trước. Chỗ nghỉ sẽ tự xử lý giao dịch thanh toán khi Quý vị nhận phòng hoặc trực tiếp theo điều kiện của đại lý.", "No prepayment is needed. The property handles all payment processing directly at check-in.")}</p>
              </div>

              <div>
                <strong className="font-extrabold text-slate-900 block mb-1">{t("3. Trẻ em và giường phụ", "3. Children and extra beds")}</strong>
                <p>{t("Phù hợp cho tất cả trẻ em. Chỗ nghỉ này không cung cấp nôi/cũi trẻ em và giường phụ.", "Children of all ages are welcome. Cribs and extra beds are not available at this property.")}</p>
              </div>

              <div>
                <strong className="font-extrabold text-slate-900 block mb-1">{t("4. Quy tắc chung tại chỗ nghỉ", "4. General house rules")}</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-650 font-semibold">
                  <li>{t("Cấm hút thuốc trong toàn bộ khuôn viên phòng.", "No smoking allowed inside rooms.")}</li>
                  <li>{t("Không cho phép tổ chức tiệc tùng hay sự kiện.", "No parties or events allowed.")}</li>
                  <li>{t("Vật nuôi được phép mang theo nếu có yêu cầu trước (có thể tính thêm phí).", "Pets are allowed upon request (surcharges may apply).")}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer print note */}
        <div className="border-t border-slate-200 pt-3.5 mt-8 flex justify-between items-center text-[10px] text-slate-400 font-medium">
          <span>staysaga.vn</span>
          <span>{t("Ngày in ấn:", "Printed on:")} {format(new Date(), "dd/MM/yyyy HH:mm")}</span>
        </div>
      </section>
    </>
  );
}
