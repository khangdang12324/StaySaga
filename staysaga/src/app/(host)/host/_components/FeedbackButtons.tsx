"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";

export function FeedbackButtons() {
  const handleFeedback = (type: "up" | "down") => {
    toast.success("Cảm ơn Quý vị đã gửi phản hồi!");
  };

  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span>Trang này có hữu ích không?</span>
      <button
        onClick={() => handleFeedback("up")}
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-600 hover:text-slate-900 cursor-pointer shadow-sm focus:outline-none"
        title="Có, trang này hữu ích"
      >
        <ThumbsUp size={14} className="stroke-[2]" />
      </button>
      <button
        onClick={() => handleFeedback("down")}
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-600 hover:text-slate-900 cursor-pointer shadow-sm focus:outline-none"
        title="Không, trang này không hữu ích"
      >
        <ThumbsDown size={14} className="stroke-[2]" />
      </button>
    </div>
  );
}
