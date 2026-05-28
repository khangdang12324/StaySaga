"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { format } from "date-fns";
import { changeBookingPriceAndDates } from "@/core/bookings/actions";
import toast from "react-hot-toast";

type ChangePriceModalProps = {
  booking: any;
  hotelName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ChangePriceModal({
  booking,
  hotelName,
  onClose,
  onSuccess,
}: ChangePriceModalProps) {
  const [checkIn, setCheckIn] = useState(
    booking.check_in_date ? booking.check_in_date.slice(0, 10) : ""
  );
  const [checkOut, setCheckOut] = useState(
    booking.check_out_date ? booking.check_out_date.slice(0, 10) : ""
  );
  const [price, setPrice] = useState<number>(Number(booking.total_price || 0));
  
  // 'idle' | 'applying' | 'success'
  const [status, setStatus] = useState<"idle" | "applying" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || price < 0) {
      toast.error("Vui lòng điền đầy đủ thông tin hợp lệ.");
      return;
    }

    setStatus("applying");
    try {
      const res = await changeBookingPriceAndDates(booking.id, checkIn, checkOut, price);
      if (res?.error) {
        toast.error(res.error);
        setStatus("idle");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật đơn đặt phòng.");
      setStatus("idle");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "";
      const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return `${weekdays[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1} ${d.getFullYear()}`;
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[999] animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 relative">
        
        {/* Close Button */}
        {status !== "applying" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {status === "idle" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Đổi giá & ngày đặt phòng
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày nhận phòng (Check-in)
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Ngày trả phòng (Check-out)
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tổng tiền phòng mới (VND)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                min={0}
                placeholder="Nhập giá mới..."
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-semibold"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Áp dụng thay đổi
              </button>
            </div>
          </form>
        )}

        {status === "applying" && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-900">
              Đổi giá & ngày đặt phòng
            </h3>
            
            {/* Spinning Loader */}
            <div className="h-12 w-12 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin my-4" />
            
            <p className="text-sm font-bold text-slate-600">
              Đang áp dụng thay đổi...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Đổi giá & ngày đặt phòng
              </h3>
              <p className="text-emerald-700 font-extrabold text-sm">
                Đã đổi giá đặt phòng
              </p>
            </div>

            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-3.5 text-xs text-slate-650 font-semibold leading-relaxed">
              <p className="text-slate-900 font-extrabold text-[13px]">
                Đã thay đổi thành công {hotelName}
              </p>
              
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Ngày lưu trú</span>
                <p className="text-slate-800 text-sm font-extrabold">
                  {formatDate(checkIn)} — {formatDate(checkOut)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Tổng giá đã đổi thành</span>
                <p className="text-rose-600 text-base font-black">
                  VND {price.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccess();
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-8 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
