"use client";

import { useState } from "react";
import { Printer, CalendarDays, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import ChangePriceModal from "./ChangePriceModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type BookingActionsProps = {
  booking: any;
  hotelName: string;
};

export default function BookingActions({ booking, hotelName }: BookingActionsProps) {
  const [isChangePriceOpen, setIsChangePriceOpen] = useState(false);
  const router = useRouter();

  const handlePrint = () => {
    // We will trigger printing
    window.print();
  };

  const formatDateStr = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "-";
      const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return `${weekdays[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
    } catch {
      return "-";
    }
  };

  const currency = new Intl.NumberFormat("vi-VN");

  const statusLabel: Record<string, string> = {
    PENDING: "Chờ phản hồi",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn tất",
    NO_SHOW: "Khách không đến",
  };

  const paymentLabel: Record<string, string> = {
    UNPAID: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    PAY_AT_PROPERTY: "Thanh toán tại chỗ nghỉ",
    REFUNDED: "Đã hoàn tiền",
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        #booking-print-document {
          display: none;
        }

        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body > * {
            display: none !important;
          }

          #booking-print-document {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            color: #1e293b;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: white;
            padding: 10px;
          }
        }
      `}</style>

      {/* Action Buttons Panel */}
      <div className="border border-slate-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={handlePrint}
          className="w-full border border-[#f60057] py-3 font-bold text-[#f60057] hover:bg-rose-50/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-5 h-5" />
          In trang này
        </button>

        <h3 className="mt-8 text-xl font-black text-slate-900">Quản lý đặt phòng</h3>
        
        <div className="mt-5 grid gap-3">
          {booking.status === "CANCELLED" ? (
            <button
              type="button"
              disabled
              className="border border-slate-300 py-3 font-bold text-slate-400 cursor-not-allowed bg-slate-50 text-center"
            >
              Đổi giá & ngày đặt phòng
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsChangePriceOpen(true)}
              className="border border-[#f60057] py-3 font-bold text-[#f60057] hover:bg-rose-50/50 transition-colors cursor-pointer text-center"
            >
              Đổi giá & ngày đặt phòng
            </button>
          )}
          
          {booking.status !== "CANCELLED" && (
            <button
              type="button"
              onClick={() => toast.error("Tính năng này cần sự hỗ trợ của CSKH StaySaga.")}
              className="border border-[#f60057] py-3 font-bold text-[#f60057] hover:bg-rose-50/50 transition-colors cursor-pointer"
            >
              Yêu cầu hủy đặt phòng
            </button>
          )}
          
          <button
            type="button"
            disabled
            className="border border-slate-300 py-3 font-bold text-slate-400 cursor-not-allowed bg-slate-50"
          >
            Đánh dấu vắng mặt
          </button>
        </div>
      </div>

      {/* Change Price & Dates Modal */}
      {isChangePriceOpen && (
        <ChangePriceModal
          booking={booking}
          hotelName={hotelName}
          onClose={() => setIsChangePriceOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}

      {/* Printable Booking Invoice (Hidden on screen, shown only when printing) */}
      <div id="booking-print-document" className="hidden print:block">
        <div className="border-b border-slate-300 pb-6 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-[#f60057]">StaySaga</h1>
            <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý Homestay hàng đầu</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800">XÁC NHẬN ĐẶT PHÒNG</h2>
            <p className="text-xs text-slate-500 mt-1">Ngày in: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </div>

        {/* Accommodation info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
          <h3 className="text-xl font-bold text-slate-900">{hotelName}</h3>
          <p className="text-sm text-slate-650 mt-1">Địa điểm: {booking.homestay?.city || "Việt Nam"}</p>
        </div>

        {/* Grid info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin đặt phòng</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Mã đặt phòng:</span> <strong className="font-semibold text-slate-900">{booking.booking_code || booking.id.slice(0, 8)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Ngày đặt:</span> <span className="text-slate-800">{formatDateStr(booking.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Trạng thái:</span> <strong className="text-[#f60057]">{statusLabel[booking.status] || booking.status}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Kênh:</span> <span className="text-slate-800">StaySaga Extranet</span></div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin khách hàng</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Tên khách:</span> <strong className="font-semibold text-slate-900">{booking.guest_name || "Khách StaySaga"}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="text-slate-800">{booking.guest_email || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Số điện thoại:</span> <span className="text-slate-800">{booking.guest_phone || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Số khách:</span> <span className="text-slate-800">{booking.guests || 1} khách người lớn</span></div>
            </div>
          </div>
        </div>

        {/* Dates card */}
        <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-lg p-4 mb-6 text-center">
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">NGÀY NHẬN PHÒNG</span>
            <strong className="text-slate-800 text-base block">{formatDateStr(booking.check_in_date)}</strong>
            <span className="text-xs text-slate-500 mt-0.5 block">Từ 14:00</span>
          </div>
          <div className="border-x border-slate-200 flex flex-col justify-center">
            <span className="text-xs text-slate-400 font-bold block mb-1">THỜI GIAN LƯU TRÚ</span>
            <strong className="text-lg font-extrabold text-[#f60057] block">{booking.nights || 1} đêm</strong>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block mb-1">NGÀY TRẢ PHÒNG</span>
            <strong className="text-slate-800 text-base block">{formatDateStr(booking.check_out_date)}</strong>
            <span className="text-xs text-slate-500 mt-0.5 block">Trước 12:00</span>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5">
            <h4 className="text-sm font-bold text-slate-800">Chi tiết thanh toán</h4>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between text-slate-650">
              <span>Giá phòng ({booking.nights || 1} đêm):</span>
              <span>{currency.format(Number(booking.price_per_night || booking.total_price || 0))} VND/đêm</span>
            </div>
            <div className="flex justify-between text-slate-650">
              <span>Hình thức thanh toán:</span>
              <span>{paymentLabel[booking.payment_status || ""] || "Chưa thanh toán"}</span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline">
              <strong className="text-base text-slate-900">Tổng cộng (đã bao gồm thuế):</strong>
              <strong className="text-xl text-[#f60057] font-black">VND {currency.format(Number(booking.total_price || 0))}</strong>
            </div>
          </div>
        </div>

        {/* Special requests */}
        {booking.special_request && (
          <div className="border border-slate-200 rounded-lg p-4 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Yêu cầu đặc biệt từ khách</h4>
            <p className="text-sm text-slate-700 italic leading-relaxed">"{booking.special_request}"</p>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 mt-12 pt-6 border-t border-slate-200">
          <p>Cảm ơn Quý vị đã sử dụng dịch vụ của StaySaga Hotels & Resorts.</p>
          <p className="mt-1">Mọi thắc mắc vui lòng liên hệ Bộ phận Dịch vụ Khách hàng StaySaga.</p>
        </div>
      </div>
    </>
  );
}
