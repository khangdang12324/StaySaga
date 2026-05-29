"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import {
  Tag,
  Calendar,
  Smartphone,
  Check,
  AlertTriangle,
  Gift,
  Zap,
} from "lucide-react";

type Params = Promise<{ sub: string }>;

export default function HostPromotionSubPage({ params }: { params: Params }) {
  const router = useRouter();
  const { sub } = use(params);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg("Kích hoạt chương trình khuyến mãi thành công! (Dữ liệu chạy thử nghiệm)");
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1200);
  };

  const getSubConfig = () => {
    switch (sub) {
      case "new":
        return {
          title: "Tạo chương trình khuyến mãi mới",
          description: "Thiết lập loại hình ưu đãi phù hợp với chiến dịch bán hàng của bạn để tối ưu doanh số.",
          icon: Tag,
          breadcrumb: "Tạo khuyến mãi mới",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Loại khuyến mãi</label>
                  <select className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none">
                    <option>Ưu đãi cơ bản (Basic Deal)</option>
                    <option>Đặt phút chót (Last-minute Deal)</option>
                    <option>Đặt sớm nhận ưu đãi (Early Bird)</option>
                    <option>Khách hàng trung thành (Loyalty Member)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Mức giảm giá (%)</label>
                  <input required type="number" min="5" max="90" defaultValue="15" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057]" />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Ngày bắt đầu áp dụng</label>
                  <input required type="date" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057]" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Ngày kết thúc áp dụng</label>
                  <input required type="date" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Tên chương trình khuyến mãi (Hiển thị nội bộ)</label>
                <input required placeholder="Ví dụ: Giảm giá hè rực rỡ 2026" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057]" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang tạo..." : "Kích hoạt khuyến mãi"}
              </button>
            </form>
          ),
        };
      case "seasonal":
        return {
          title: "Khuyến mãi theo mùa",
          description: "Tham gia các chiến dịch lớn trong năm của StaySaga để tăng cơ hội tiếp cận lượng lớn khách hàng tiềm năng.",
          icon: Calendar,
          breadcrumb: "Khuyến mãi theo mùa",
          content: (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border border-slate-200 bg-white p-5 rounded-sm flex flex-col justify-between space-y-4">
                  <div>
                    <span className="inline-block bg-[#f60057] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Đang mở đăng ký</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2">Ưu đãi mùa hè rực rỡ 2026</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Giảm giá tối thiểu 15% cho các đơn đặt phòng từ ngày 01/06/2026 đến 31/08/2026. Chỗ nghỉ của bạn sẽ nhận được huy hiệu đặc biệt trên trang tìm kiếm.
                    </p>
                  </div>
                  <button onClick={handleSubmit} className="h-10 bg-[#f60057] text-white font-bold text-sm hover:bg-[#d9004c]">Đăng ký tham gia</button>
                </div>

                <div className="border border-slate-200 bg-white p-5 rounded-sm flex flex-col justify-between space-y-4">
                  <div>
                    <span className="inline-block bg-slate-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Sắp mở</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-2">Đón tết trung thu ấm áp</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      Chương trình ưu đãi cho mùa trung thu đoàn viên. Mức giảm giá khuyến nghị từ 12% kèm dịch vụ bánh trung thu tự làm tặng khách.
                    </p>
                  </div>
                  <button disabled className="h-10 bg-slate-250 text-slate-500 font-bold text-sm cursor-not-allowed">Chưa mở đăng ký</button>
                </div>
              </div>
            </div>
          ),
        };
      case "mobile":
        return {
          title: "Ưu đãi Mobile đặc quyền",
          description: "Người dùng di động chiếm tới 65% lượt truy cập. Cung cấp giá mobile giúp chỗ nghỉ nổi bật hơn và tăng 28% lượt đặt.",
          icon: Smartphone,
          breadcrumb: "Ưu đãi mobile",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border border-slate-200 bg-white p-6 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Cấu hình chiết khấu thiết bị di động</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Mức chiết khấu khuyên dùng là 10% để tối ưu hiển thị trên các thiết bị di động.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f60057]"></div>
                  </label>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                  <span className="font-medium text-slate-700">Mức chiết khấu:</span>
                  <div className="flex items-center gap-2">
                    <input type="number" defaultValue="10" className="h-10 w-20 border border-slate-350 text-center font-bold" />
                    <span>%</span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang kích hoạt..." : "Kích hoạt ưu đãi Mobile"}
              </button>
            </form>
          ),
        };
      default:
        return {
          title: "Chương trình khuyến mãi",
          description: "Thiết lập ưu đãi giảm giá phòng.",
          icon: Tag,
          breadcrumb: "Khuyến mãi",
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
            { label: "Chương trình khuyến mãi", href: "/host/promotions" },
            { label: config.breadcrumb },
          ]}
        />

        {successMsg && (
          <div className="mb-6 flex items-center gap-2 border border-emerald-300 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            <Check className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Area */}
          <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-[#f60057]">
              <Icon className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold">Cấu hình khuyến mãi</h2>
            </div>
            {config.content}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="border border-rose-200 bg-rose-50 p-5 rounded-sm">
              <div className="flex gap-3 text-[#f60057]">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Tính năng đang phát triển</h4>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-700">
                    Phần cài đặt khuyến mãi này hiện đang chạy ở chế độ thử nghiệm trực quan. Các đăng ký sẽ được tự động đồng bộ khi hệ thống đi vào vận hành.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-250 bg-white p-5 rounded-sm">
              <h4 className="font-bold text-sm text-slate-900">Chiến lược giá tốt nhất</h4>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Hãy kết hợp Ưu đãi mùa du lịch với Giá mobile để tiếp cận đến 80% khách hàng tiềm năng. Mức chiết khấu cộng dồn được kiểm soát để đảm bảo lợi nhuận tối đa của bạn.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}
