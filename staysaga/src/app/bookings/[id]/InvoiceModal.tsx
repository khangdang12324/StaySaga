"use client";

import React, { useState } from "react";
import { X, MessageSquare, Phone, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { submitInvoiceRequest } from "@/core/bookings/actions";

interface InvoiceModalProps {
  bookingId: string;
  hostPhone?: string;
  hostEmail?: string;
  onClose: () => void;
  lang: string;
}

export default function InvoiceModal({
  bookingId,
  hostPhone,
  onClose,
  lang,
}: InvoiceModalProps) {
  const [isPending, setIsPending] = useState(false);
  const t = (vi: string, en: string) => (lang === "EN" ? en : vi);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.append("bookingId", bookingId);

    try {
      const res = await submitInvoiceRequest(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          t(
            "Gửi yêu cầu hóa đơn thành công!",
            "Invoice request sent successfully!",
          ),
        );
        if (res?.warning) {
          toast.success(res.warning);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(t("Đã có lỗi xảy ra.", "An error occurred."));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-900">
            {t("Yêu cầu hóa đơn", "Request invoice")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-650 leading-relaxed">
            {t(
              "Chỉ chỗ nghỉ mới có thể xuất hóa đơn cho kỳ lưu trú đã hoàn tất. Để nhận hóa đơn nhanh chóng, vui lòng yêu cầu tại chỗ nghỉ trước khi trả phòng hoặc liên hệ trực tiếp với họ.",
              "Only the property can issue invoices for completed stays. To get your invoice quickly, please request it at the property before check-out or contact them directly.",
            )}
          </div>

          {/* Quick Contact Actions */}
          <div className="flex flex-col gap-4">
            <a
              href={`/messages?bookingId=${bookingId}`}
              className="w-full border-2 border-rose-600 bg-white hover:bg-rose-50/10 text-rose-600 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-rose-600" />
              {t("Nhắn tin cho chỗ nghỉ", "Message property")}
            </a>

            <a
              href={`tel:${hostPhone || "+842836225811"}`}
              className="text-rose-600 hover:text-rose-800 hover:underline font-bold text-sm text-center py-2 flex items-center justify-center gap-2 transition-all self-center cursor-pointer"
            >
              <Phone className="w-4 h-4 text-rose-500" />
              {t(
                `Gọi chỗ nghỉ (${hostPhone || "+842836225811"})`,
                `Call property (${hostPhone || "+842836225811"})`,
              )}
            </a>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Hoặc điền thông tin", "Or fill info")}
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Invoice Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                {t("Tên công ty", "Company name")}
              </label>
              <input
                type="text"
                name="companyName"
                placeholder={t(
                  "Cụm công ty, tổng công ty...",
                  "Company name...",
                )}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                  {t("Mã số thuế", "Tax code")}
                </label>
                <input
                  type="text"
                  name="taxCode"
                  placeholder="e.g. 0102030405"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                  {t("Email nhận hóa đơn", "Billing email")}
                </label>
                <input
                  type="email"
                  name="billingEmail"
                  placeholder="company@email.com"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                {t("Địa chỉ xuất hóa đơn", "Billing address")}
              </label>
              <input
                type="text"
                name="billingAddress"
                placeholder={t(
                  "Địa chỉ đăng ký kinh doanh...",
                  "Business registration address...",
                )}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-650 uppercase tracking-wider mb-1.5">
                {t("Ghi chú thêm", "Note")}
              </label>
              <textarea
                name="note"
                rows={2}
                placeholder={t(
                  "Ví dụ: xuất trước ngày 25...",
                  "E.g. issue before 25th...",
                )}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder-slate-400 resize-none"
              />
            </div>

            {/* Footer Form Submit */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                {t("Bỏ qua", "Close")}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:bg-rose-400 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("Đang gửi...", "Sending...")}
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {t("Gửi yêu cầu", "Submit Request")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
