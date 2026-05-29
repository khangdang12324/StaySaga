"use client";

import { use, useState } from "react";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import {
  TrendingUp,
  FileText,
  DollarSign,
  Eye,
  Check,
} from "lucide-react";

type Params = Promise<{ sub: string }>;

export default function HostPerformanceSubPage({ params }: { params: Params }) {
  const { sub } = use(params);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApply = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg("Đã áp dụng đề xuất tối ưu thành công!");
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 1000);
  };

  const getSubConfig = () => {
    switch (sub) {
      case "content":
        return {
          title: "Chất lượng nội dung chỗ nghỉ",
          description: "Điểm chất lượng nội dung trang chỗ nghỉ ảnh hưởng lớn đến quyết định đặt phòng của khách hàng.",
          icon: FileText,
          breadcrumb: "Chất lượng nội dung",
          content: (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-5 rounded-sm">
                <div className="flex justify-between items-center border-b pb-4">
                  <span className="font-bold text-slate-800">Điểm nội dung trung bình:</span>
                  <span className="text-2xl font-black text-[#f60057]">85%</span>
                </div>
                <div className="mt-4 space-y-3">
                  <p className="font-semibold text-sm text-slate-700">Đề xuất cải thiện:</p>
                  <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                    <li>Thêm ít nhất 4 ảnh góc rộng có độ phân giải cao (+10% điểm)</li>
                    <li>Điền đầy đủ mô tả chi tiết phòng ngủ (+5% điểm)</li>
                    <li>Cập nhật các tiện nghi xung quanh vị trí bản đồ (+5% điểm)</li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        };
      case "pricing":
        return {
          title: "Tối ưu hóa giá bán phòng",
          description: "So sánh mức giá của bạn với các đối thủ trong khu vực và nhận các gợi ý điều chỉnh giá thông minh.",
          icon: DollarSign,
          breadcrumb: "Tối ưu giá",
          content: (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-5 rounded-sm space-y-4">
                <h3 className="font-bold text-slate-800">Chỉ số cạnh tranh giá</h3>
                <p className="text-sm text-slate-600">Giá bán của bạn hiện thấp hơn 5% so với mức trung bình của các homestay tương đương ở địa phương.</p>
                <div className="rounded bg-rose-50 border border-rose-100 p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-[#f60057]">Áp dụng giá linh động thông minh</p>
                    <p className="text-xs text-slate-500 mt-1">Hệ thống sẽ tự động điều chỉnh giá +/- 10% theo nhu cầu thị trường.</p>
                  </div>
                  <button onClick={handleApply} disabled={loading} className="bg-[#f60057] text-white px-4 py-2 text-xs font-bold hover:bg-[#d9004c]">
                    {loading ? "Đang bật..." : "Bật tối ưu giá"}
                  </button>
                </div>
              </div>
            </div>
          ),
        };
      case "visibility":
        return {
          title: "Gợi ý tăng hiển thị tìm kiếm",
          description: "Tăng khả năng tiếp cận khách hàng bằng cách tối ưu hóa từ khóa và tham gia các gói tăng cường hiển thị.",
          icon: Eye,
          breadcrumb: "Gợi ý hiển thị",
          content: (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-5 rounded-sm space-y-4">
                <h3 className="font-bold text-slate-800">Báo cáo lượt xuất hiện</h3>
                <p className="text-sm text-slate-600">Chỗ nghỉ của bạn xuất hiện trong 1.250 lượt tìm kiếm trong 7 ngày qua.</p>
                <div className="rounded bg-emerald-50 border border-emerald-100 p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-emerald-800">Tham gia chương trình Đối Tác Ưu Tú (Preferred Partner)</p>
                    <p className="text-xs text-slate-600 mt-1">Tăng gấp 1.5 lần lượt tiếp cận khách hàng tiềm năng.</p>
                  </div>
                  <button onClick={handleApply} className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-800">
                    Đăng ký ngay
                  </button>
                </div>
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Hiệu suất hoạt động",
          description: "Thông số thúc đẩy hiệu suất.",
          icon: TrendingUp,
          breadcrumb: "Hiệu suất",
          content: <EmptyState isDeveloping />,
        };
    }
  };

  const config = getSubConfig();
  const Icon = config.icon;
  const userName = "Tài khoản đối tác";

  return (
    <HostExtranetShell active="opportunities" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: "Thúc đẩy hiệu suất", href: "/host/opportunities" },
            { label: config.breadcrumb },
          ]}
        />

        {successMsg && (
          <div className="mb-6 border border-emerald-300 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-[#f60057]">
              <Icon className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold">Chi tiết phân tích</h2>
            </div>
            {config.content}
          </div>

          <aside className="border border-slate-250 bg-white p-5 rounded-sm h-fit">
            <h4 className="font-bold text-sm text-slate-900">Tại sao hiệu suất quan trọng?</h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Việc cải thiện chất lượng nội dung và giá cả giúp chỗ nghỉ có tỷ lệ chuyển đổi cao hơn, thu hút nhiều lượt đặt phòng từ khách gia đình và khách nước ngoài.
            </p>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}
