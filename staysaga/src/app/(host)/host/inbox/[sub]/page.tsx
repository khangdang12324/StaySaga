"use client";

import { use } from "react";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { Bell, HelpCircle } from "lucide-react";

type Params = Promise<{ sub: string }>;

export default function HostInboxSubPage({ params }: { params: Params }) {
  const { sub } = use(params);

  const getSubConfig = () => {
    switch (sub) {
      case "system":
        return {
          title: "Tin nhắn từ StaySaga",
          description: "Thông báo chính thức, cập nhật chính sách và tin tức hoạt động từ Ban quản trị StaySaga.",
          icon: Bell,
          breadcrumb: "Tin nhắn hệ thống",
          content: (
            <div className="space-y-4">
              <div className="border border-slate-200 bg-white p-5 rounded-sm">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
                  <span>BAN QUẢN TRỊ STAYSAGA</span>
                  <span>28/05/2026</span>
                </div>
                <h4 className="font-bold text-base text-slate-800">Cập nhật chính sách thanh toán và hoa hồng năm 2026</h4>
                <p className="text-sm text-slate-650 mt-2 leading-relaxed">
                  Chúng tôi xin thông báo về việc cập nhật biểu phí hoa hồng dịch vụ mới áp dụng từ tháng 6/2026. Mức hoa hồng tiêu chuẩn dành cho Host sẽ được duy trì ổn định ở mức 10%. Các điều khoản chi tiết đã được cập nhật tại phụ lục hợp đồng điện tử của bạn.
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-5 rounded-sm">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
                  <span>HỆ THỐNG AN NINH</span>
                  <span>15/05/2026</span>
                </div>
                <h4 className="font-bold text-base text-slate-800">Xác thực tài khoản và cấu hình ngân hàng nhận tiền</h4>
                <p className="text-sm text-slate-650 mt-2 leading-relaxed">
                  Để đảm bảo giao dịch rút tiền doanh thu diễn ra thông suốt, vui lòng kiểm tra và hoàn tất thông tin tài khoản ngân hàng chính chủ của bạn trong phần Cài đặt tài chính trước ngày 30/05/2026.
                </p>
              </div>
            </div>
          ),
        };
      case "faq":
        return {
          title: "Câu hỏi thường gặp (FAQ)",
          description: "Giải đáp các thắc mắc phổ biến của Host khi vận hành, đón khách và xử lý thanh toán trên hệ thống StaySaga.",
          icon: HelpCircle,
          breadcrumb: "Câu hỏi thường gặp",
          content: (
            <div className="space-y-4">
              <div className="border border-slate-200 bg-white p-4 rounded-sm">
                <h4 className="font-bold text-[15px] text-slate-900">1. Làm thế nào để đóng phòng tạm thời khi bận việc cá nhân?</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Bạn truy cập mục <strong>Giá & Tình trạng phòng trống</strong> &gt; <strong>Mở/đóng phòng</strong> và tắt nút gạt hoạt động của homestay tương ứng. Khách hàng sẽ không thể tìm thấy hoặc đặt phòng của bạn cho đến khi bạn bật lại.
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-4 rounded-sm">
                <h4 className="font-bold text-[15px] text-slate-900">2. StaySaga thanh toán doanh thu cho Host vào thời gian nào?</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Doanh thu sau khi trừ phí hoa hồng sẽ được đối soát tự động và chuyển khoản trực tiếp vào tài khoản ngân hàng của bạn vào ngày 05 và ngày 20 hàng tháng.
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-4 rounded-sm">
                <h4 className="font-bold text-[15px] text-slate-900">3. Tôi có thể từ chối yêu cầu đặt phòng của khách không?</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Đối với chế độ đặt phòng Instant Book (Đặt ngay), phòng sẽ được xác nhận tự động. Đối với chế độ Request (Yêu cầu đặt phòng), bạn có quyền duyệt hoặc từ chối yêu cầu trong vòng 24 giờ.
                </p>
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Hộp thư",
          description: "Thông tin hỗ trợ và tin nhắn hệ thống.",
          icon: Bell,
          breadcrumb: "Hộp thư",
          content: <EmptyState isDeveloping />,
        };
    }
  };

  const config = getSubConfig();
  const Icon = config.icon;
  const userName = "Tài khoản đối tác";

  return (
    <HostExtranetShell active="messages" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: "Hộp thư", href: "/host/messages" },
            { label: config.breadcrumb },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-[#f60057]">
              <Icon className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold">Danh sách thông tin</h2>
            </div>
            {config.content}
          </div>

          <aside className="border border-slate-250 bg-white p-5 rounded-sm h-fit">
            <h4 className="font-bold text-sm text-slate-900">Trung tâm trợ giúp</h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Nếu bạn không tìm thấy câu trả lời cho thắc mắc của mình, vui lòng liên hệ bộ phận hỗ trợ đối tác 24/7 của chúng tôi qua hotline hoặc email.
            </p>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}
