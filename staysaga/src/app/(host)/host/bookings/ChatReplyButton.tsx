"use client";

import { useState } from "react";
import { MessageSquareReply, X } from "lucide-react";
import { respondToCancellationRequest } from "@/core/bookings/actions";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type ChatReplyButtonProps = {
  messageText: string;
  senderRole: string;
  bookingId: string;
  bookingStatus: string;
};

export default function ChatReplyButton({
  messageText,
  senderRole,
  bookingId,
  bookingStatus,
}: ChatReplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [responseType, setResponseType] = useState<"accept" | "decline" | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const router = useRouter();

  // Only render if it's a guest message, request waiver, and booking is not already cancelled
  const isRequest =
    senderRole === "USER" &&
    (messageText.toLowerCase().includes("hủy phòng") ||
      messageText.toLowerCase().includes("hủy miễn phí") ||
      messageText.toLowerCase().includes("waive the cancellation fee"));

  if (!isRequest || bookingStatus === "CANCELLED") {
    return null;
  }

  const handleSubmit = async () => {
    if (!responseType) return;
    setStatus("sending");
    try {
      const res = await respondToCancellationRequest(
        bookingId,
        responseType === "accept",
        note
      );
      if (res?.error) {
        toast.error(res.error);
        setStatus("idle");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi gửi phản hồi.");
      setStatus("idle");
    }
  };

  return (
    <>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 bg-[#006ce4] hover:bg-[#005bb8] text-white font-bold px-3 py-1.5 rounded-sm text-xs transition-colors cursor-pointer shadow-sm"
        >
          <MessageSquareReply className="w-3.5 h-3.5" />
          Trả lời
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] animate-fade-in font-sans">
          <div className="bg-white rounded-md shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 p-6 relative text-slate-800">
            {/* Close Button */}
            {status !== "sending" && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResponseType(null);
                  setNote("");
                  setStatus("idle");
                }}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {status === "idle" && (
              <div className="space-y-5">
                <h3 className="text-[17px] font-extrabold text-slate-900 border-b border-slate-150 pb-3">
                  Yêu cầu hủy miễn phí
                </h3>

                <div className="text-[13px] leading-relaxed text-slate-600 bg-slate-50 p-3.5 rounded border border-slate-150">
                  <span className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">Tin nhắn của khách:</span>
                  <p className="italic text-slate-800 font-medium">"{messageText}"</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800">
                    Quý vị muốn trả lời như thế nào?
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group text-sm font-medium text-slate-800 select-none">
                      <input
                        type="radio"
                        name="response_type"
                        checked={responseType === "accept"}
                        onChange={() => setResponseType("accept")}
                        className="h-4.5 w-4.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="group-hover:text-blue-600 transition-colors">Xác nhận miễn phí</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group text-sm font-medium text-slate-800 select-none">
                      <input
                        type="radio"
                        name="response_type"
                        checked={responseType === "decline"}
                        onChange={() => setResponseType("decline")}
                        className="h-4.5 w-4.5 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="group-hover:text-blue-600 transition-colors">Từ chối</span>
                    </label>
                  </div>
                </div>

                {responseType === "accept" && (
                  <div className="space-y-1.5 animate-slide-down">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Thông tin khác:
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nhập ghi chú phản hồi cho khách..."
                      rows={3}
                      className="w-full bg-white border border-slate-350 rounded-sm p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium resize-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setResponseType(null);
                      setNote("");
                      setStatus("idle");
                    }}
                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold px-5 py-2 text-sm transition-colors cursor-pointer rounded-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={!responseType}
                    onClick={handleSubmit}
                    className={`font-bold px-5 py-2 text-sm transition-all rounded-sm shadow-sm ${
                      responseType
                        ? "bg-[#006ce4] hover:bg-[#005bb8] text-white cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    }`}
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}

            {status === "sending" && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Yêu cầu hủy miễn phí
                </h3>
                
                {/* Spinning Loader */}
                <div className="h-10 w-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin my-4" />
                
                <p className="text-sm font-bold text-slate-600">
                  Đang gửi phản hồi của Quý vị...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-5 py-2">
                <h3 className="text-[17px] font-extrabold text-slate-900 border-b border-slate-150 pb-3">
                  Yêu cầu hủy miễn phí
                </h3>
                
                <div className="text-[13px] leading-relaxed text-slate-600 bg-slate-50 p-3.5 rounded border border-slate-150">
                  <span className="block font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">Tin nhắn của khách:</span>
                  <p className="italic text-slate-800 font-medium">"{messageText}"</p>
                </div>

                <div className="py-4 text-center">
                  <p className="text-base font-extrabold text-slate-900">
                    Đã gửi phản hồi của Quý vị.
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setResponseType(null);
                      setNote("");
                      setStatus("idle");
                      router.refresh();
                    }}
                    className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold px-7 py-2 text-sm transition-all cursor-pointer rounded-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
