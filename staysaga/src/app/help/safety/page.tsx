"use client";

import { Shield, ChevronLeft, Eye, Key, HeartPulse, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function SafetyHelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Trung tâm thông tin bảo mật</h1>
        <p className="text-slate-500 text-sm mb-8">Hướng dẫn và lời khuyên giúp hành trình của bạn tại StaySaga diễn ra an toàn và trọn vẹn nhất.</p>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Key className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Bảo vệ thông tin tài khoản</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Không bao giờ chia sẻ mật khẩu đăng nhập StaySaga, mã OTP SMS hoặc OTP email cho bất kỳ ai, kể cả nhân viên tự xưng của StaySaga. Chúng tôi sẽ không bao giờ yêu cầu bạn cung cấp mật khẩu của mình qua các kênh trò chuyện hoặc điện thoại.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <Eye className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Kiểm tra thông tin chỗ nghỉ trước khi check-in</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Khi nhận phòng, hãy kiểm tra kỹ tính chính xác của địa chỉ, hình ảnh thực tế so với bài đăng trên ứng dụng StaySaga. Nếu phát hiện sai sót nghiêm trọng hoặc có dấu hiệu lừa đảo, hãy lập tức liên hệ với bộ phận CSKH StaySaga qua trang Hỗ Trợ để được giải quyết đổi phòng hoặc hoàn tiền.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <HeartPulse className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Hướng dẫn an toàn khi lưu trú</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Trước khi nhận phòng, hãy xác định các cửa thoát hiểm, bình chữa cháy của căn hộ/homestay. Tuân thủ quy định phòng cháy chữa cháy của ban quản lý tòa nhà hoặc quy định riêng của chủ homestay. Lập tức thông báo cho chủ homestay và cơ quan chức năng trong trường hợp khẩn cấp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
