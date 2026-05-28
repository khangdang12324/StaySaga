"use client";

import { FileText, ChevronLeft, Check, AlertTriangle, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function ContentGuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Hướng dẫn nội dung đánh giá và bình luận</h1>
        <p className="text-slate-500 text-sm mb-8">Quy định về việc viết đánh giá, phản hồi và tải ảnh lên hệ thống StaySaga nhằm duy trì cộng đồng lành mạnh.</p>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-500" />
              Nội dung được khuyến khích
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Đánh giá thực tế và khách quan:</strong> Mô tả chính xác các trải nghiệm của bạn trong suốt thời gian lưu trú tại homestay.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Nêu rõ ưu điểm và nhược điểm:</strong> Chia sẻ thông tin hữu ích giúp cả chủ nhà cải thiện dịch vụ và người đi sau tham khảo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span><strong>Hình ảnh chất lượng cao và chân thực:</strong> Đăng tải các bức ảnh chụp thực tế tình trạng phòng ốc, tiện nghi hoặc khuôn cảnh xung quanh.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Các hành vi bị nghiêm cấm
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Ngôn từ thô tục, công kích:</strong> Không sử dụng từ ngữ xúc phạm, phân biệt chủng tộc, thù hằn cá nhân hoặc quấy rối.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Nội dung quảng cáo, spam:</strong> Nghiêm cấm chèn link spam, quảng cáo ứng dụng khác hoặc đăng thông tin cá nhân (số điện thoại, thẻ ngân hàng).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span><strong>Thông tin sai sự thật, mua bán đánh giá:</strong> Tuyệt đối không viết đánh giá giả mạo nhằm hạ uy tín đối thủ hoặc trục lợi cá nhân.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
