"use client";

import { ChevronLeft, Scale, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function ComplaintsHelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Giải quyết khiếu nại</h1>
        <p className="text-slate-500 text-sm mb-8">Quy trình giải quyết tranh chấp công bằng, minh bạch giữa khách hàng và chủ homestay tại StaySaga.</p>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Scale className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Quy trình giải quyết tranh chấp</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Nếu bạn gặp bất kỳ vấn đề nào liên quan đến phòng ốc, tiện nghi hoặc sự cố phát sinh với chủ nhà trong thời gian lưu trú:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
              <li>Liên hệ trực tiếp với chủ homestay thông qua tin nhắn StaySaga để tìm giải pháp hòa giải nhanh chóng.</li>
              <li>Nếu không đạt được thỏa thuận, hãy gửi yêu cầu hỗ trợ kèm theo bằng chứng cụ thể (hình ảnh, video, tin nhắn) lên StaySaga trong vòng 24 giờ kể từ thời điểm nhận phòng.</li>
              <li>StaySaga sẽ đóng vai trò trung gian phân xử dựa trên chính sách đặt phòng và chứng cứ được cung cấp từ hai phía. Xử lý phản hồi trong vòng 48 giờ.</li>
            </ol>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Chính sách bảo vệ khách hàng</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              StaySaga cam kết hoàn trả lên tới 100% chi phí đặt phòng hoặc hỗ trợ tìm kiếm phòng lưu trú thay thế tương đương trong trường hợp: chỗ nghỉ không tồn tại, thông tin mô tả sai lệch nghiêm trọng, chủ chỗ nghỉ tự ý hủy lịch đặt phòng sát giờ mà không có lý do chính đáng hoặc không hỗ trợ check-in cho khách hàng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
