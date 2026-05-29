"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import {
  Copy,
  Sliders,
  Maximize2,
  Coffee,
  Users,
  Globe,
  Smartphone,
  Check,
  AlertTriangle,
} from "lucide-react";

type Params = Promise<{ sub: string }>;

export default function HostRateSubPage({ params }: { params: Params }) {
  const router = useRouter();
  const { sub } = use(params);

  // Form states to support mock actions without dead buttons
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg("Lưu thay đổi thành công! (Dữ liệu thử nghiệm đã được ghi nhận)");
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1200);
  };

  const getSubConfig = () => {
    switch (sub) {
      case "copy":
        return {
          title: "Sao chép giá cho các ngày trong tương lai",
          description: "Sao chép nhanh thiết lập giá bán và tình trạng phòng trống từ khoảng thời gian này sang khoảng thời gian khác.",
          icon: Copy,
          breadcrumb: "Sao chép giá",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Khoảng thời gian nguồn (Sao chép từ)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="date" className="h-11 border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none" />
                    <input required type="date" className="h-11 border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Khoảng thời gian đích (Sao chép đến)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="date" className="h-11 border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none" />
                    <input required type="date" className="h-11 border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Thông tin cần sao chép</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-slate-700">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-[#f60057]" />
                    <span>Giá phòng cơ bản (Base rate)</span>
                  </label>
                  <label className="flex items-center gap-2 font-medium text-slate-700">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-[#f60057]" />
                    <span>Số lượng phòng trống mở bán</span>
                  </label>
                  <label className="flex items-center gap-2 font-medium text-slate-700">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#f60057]" />
                    <span>Quy tắc giới hạn đặt phòng (Min nights, Close to arrival...)</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang xử lý..." : "Bắt đầu sao chép"}
              </button>
            </form>
          ),
        };
      case "restrictions":
        return {
          title: "Quy tắc giới hạn linh động",
          description: "Thiết lập thời gian lưu trú tối thiểu, tối đa hoặc đóng phòng tạm thời cho các ngày cụ thể để tối ưu công suất phòng.",
          icon: Sliders,
          breadcrumb: "Quy tắc giới hạn",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Số đêm lưu trú tối thiểu</label>
                  <select className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none">
                    <option>Không giới hạn</option>
                    <option>1 đêm</option>
                    <option>2 đêm</option>
                    <option>3 đêm</option>
                    <option>5 đêm</option>
                    <option>7 đêm</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Thời gian đặt trước tối thiểu</label>
                  <select className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none">
                    <option>Không giới hạn</option>
                    <option>1 ngày</option>
                    <option>3 ngày</option>
                    <option>7 ngày</option>
                    <option>14 ngày</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Đóng quyền nhận phòng vào ngày này (Closed to Arrival)</label>
                  <select className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none">
                    <option>Cho phép khách check-in</option>
                    <option>Chặn khách check-in</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang lưu..." : "Áp dụng giới hạn"}
              </button>
            </form>
          ),
        };
      case "open-rooms":
        return {
          title: "Tính năng mở phòng trống",
          description: "Mở nhanh các phòng đang trống để bán trong các khoảng thời gian cao điểm hoặc cuối tuần.",
          icon: Maximize2,
          breadcrumb: "Mở phòng trống",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-sm border border-slate-200 bg-slate-50 p-5 space-y-4">
                <h3 className="font-bold text-slate-800">Cài đặt mở phòng nhanh</h3>
                <p className="text-sm text-slate-600">Chọn khoảng thời gian để thiết lập số phòng trống tối đa hiện có.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <input required type="date" className="h-11 border border-slate-350 bg-white px-3 text-sm" />
                  <input required type="date" className="h-11 border border-slate-350 bg-white px-3 text-sm" />
                  <input required type="number" placeholder="Số lượng phòng mở bán" min="1" className="h-11 border border-slate-350 bg-white px-3 text-sm" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang cập nhật..." : "Mở phòng ngay"}
              </button>
            </form>
          ),
        };
      case "value-added":
        return {
          title: "Dịch vụ giá trị gia tăng (Add-ons)",
          description: "Tạo các gói giá bán kèm bữa sáng, dịch vụ đưa đón sân bay, spa hoặc các ưu đãi tiện ích gia tăng khác.",
          icon: Coffee,
          breadcrumb: "Dịch vụ giá trị gia tăng",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 border border-slate-200 bg-white p-5 rounded-sm">
                  <h3 className="font-bold text-slate-800">Các dịch vụ khả dụng</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 font-medium">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-[#f60057]" />
                      <span>Bữa sáng buffet (+150.000 VND / khách)</span>
                    </label>
                    <label className="flex items-center gap-3 font-medium">
                      <input type="checkbox" className="h-4 w-4 text-[#f60057]" />
                      <span>Đưa đón sân bay 2 chiều (+500.000 VND / xe)</span>
                    </label>
                    <label className="flex items-center gap-3 font-medium">
                      <input type="checkbox" className="h-4 w-4 text-[#f60057]" />
                      <span>Sử dụng dịch vụ Spa cao cấp (Giảm 20%)</span>
                    </label>
                    <label className="flex items-center gap-3 font-medium">
                      <input type="checkbox" className="h-4 w-4 text-[#f60057]" />
                      <span>Thuê xe máy tự lái (+150.000 VND / ngày)</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-4 border border-slate-200 bg-white p-5 rounded-sm">
                  <h3 className="font-bold text-slate-800">Tên gói ưu đãi đi kèm</h3>
                  <input required placeholder="Ví dụ: Gói Giá Tốt Kèm Bữa Sáng" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none" />
                  <p className="text-xs text-slate-500">Tên này sẽ hiển thị trực tiếp cho khách hàng trên website và app StaySaga.</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang lưu..." : "Tạo gói add-on"}
              </button>
            </form>
          ),
        };
      case "per-guest":
        return {
          title: "Giá theo số lượng khách",
          description: "Điều chỉnh mức giá bán linh động tăng giảm dựa trên số lượng khách thực tế ở phòng (ví dụ: giá ưu đãi cho khách đi 1 người).",
          icon: Users,
          breadcrumb: "Giá theo số lượng khách",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border border-slate-200 bg-white p-6 rounded-sm space-y-4">
                <h3 className="font-bold text-slate-800">Quy tắc tính giá theo số lượng khách</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-40 font-medium">Mặc định (Số khách chuẩn):</span>
                    <span className="font-bold">100% giá phòng cơ bản</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-40 font-medium">Giảm trừ cho ít khách hơn:</span>
                    <div className="flex items-center gap-2">
                      <span>Giảm</span>
                      <input type="number" defaultValue="15" className="h-10 w-20 border border-slate-350 text-center" />
                      <span>% mỗi khách thiếu</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-40 font-medium">Phụ thu thêm khách:</span>
                    <div className="flex items-center gap-2">
                      <span>Thu thêm</span>
                      <input type="number" defaultValue="150000" className="h-10 w-32 border border-slate-350 text-center" />
                      <span>VND / người / đêm</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang lưu..." : "Áp dụng giá theo khách"}
              </button>
            </form>
          ),
        };
      case "country":
        return {
          title: "Mức giá theo quốc gia",
          description: "Tạo các mức giá ưu đãi đặc biệt hướng tới khách hàng từ các quốc gia hoặc vùng lãnh thổ mục tiêu.",
          icon: Globe,
          breadcrumb: "Mức giá theo quốc gia",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 border border-slate-200 bg-white p-5 rounded-sm">
                  <h3 className="font-bold text-slate-800">Chọn quốc gia áp dụng</h3>
                  <select className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:border-[#f60057] focus:outline-none">
                    <option>Hàn Quốc</option>
                    <option>Nhật Bản</option>
                    <option>Trung Quốc</option>
                    <option>Úc</option>
                    <option>Hoa Kỳ</option>
                    <option>Các nước Đông Nam Á (ASEAN)</option>
                  </select>
                </div>
                <div className="space-y-4 border border-slate-200 bg-white p-5 rounded-sm">
                  <h3 className="font-bold text-slate-800">Mức chiết khấu áp dụng</h3>
                  <div className="flex items-center gap-2">
                    <input type="number" min="5" max="50" defaultValue="10" className="h-11 w-24 border border-slate-350 text-center text-sm font-bold" />
                    <span className="font-bold">% Giảm giá</span>
                  </div>
                  <p className="text-xs text-slate-500">Mức giảm giá đề xuất tối thiểu là 10% để thu hút lượng đặt phòng từ các thị trường quốc tế.</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang lưu..." : "Áp dụng giá quốc gia"}
              </button>
            </form>
          ),
        };
      case "mobile":
        return {
          title: "Giá trên điện thoại",
          description: "Thu hút hơn 60% lượng đặt phòng bằng cách cung cấp mức giá ưu đãi đặc biệt dành cho khách đặt bằng thiết bị di động.",
          icon: Smartphone,
          breadcrumb: "Giá trên điện thoại",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border border-slate-200 bg-white p-6 rounded-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Kích hoạt giá Mobile</h3>
                    <p className="text-sm text-slate-500 mt-1">Khách hàng dùng Chrome, Safari trên điện thoại hoặc App sẽ thấy mức giá ưu đãi này.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f60057]"></div>
                  </label>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                  <span className="font-medium text-slate-700">Mức chiết khấu khuyên dùng:</span>
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
                {loading ? "Đang lưu..." : "Lưu cấu hình giá mobile"}
              </button>
            </form>
          ),
        };
      default:
        return {
          title: "Chi tiết loại giá",
          description: "Thông tin cấu hình giá và phòng trống.",
          icon: Sliders,
          breadcrumb: "Cấu hình",
          content: <EmptyState isDeveloping />,
        };
    }
  };

  const config = getSubConfig();
  const Icon = config.icon;

  const userName = "Tài khoản đối tác";

  return (
    <HostExtranetShell active="calendar" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: "Giá & Tình trạng phòng trống", href: "/host/calendar" },
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
              <h2 className="text-xl font-bold">Cấu hình chức năng</h2>
            </div>
            {config.content}
          </div>

          {/* Sidebar Info */}
          <aside className="space-y-6">
            <div className="border border-rose-200 bg-rose-50 p-5 rounded-sm">
              <div className="flex gap-3 text-[#f60057]">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Tính năng đang phát triển</h4>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-700">
                    Phần cài đặt này hiện đang hoạt động ở chế độ mô phỏng trực quan. Các thay đổi của bạn sẽ được lưu tạm thời trên phiên làm việc hiện tại và đồng bộ đầy đủ khi hệ thống backend hoàn thành.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-slate-250 bg-white p-5 rounded-sm">
              <h4 className="font-bold text-sm text-slate-900">Mẹo vận hành từ StaySaga</h4>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                Hãy cung cấp các mức giá đa dạng, đặc biệt là ưu đãi trên điện thoại (Mobile) hoặc giảm giá theo nước (Country rates) để tăng khả năng xuất hiện trên các bộ lọc tìm kiếm tới 30%.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}
