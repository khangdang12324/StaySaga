"use client";

import { use, useState } from "react";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import {
  Coins,
  FileText,
  CreditCard,
  Building,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type Params = Promise<{ sub: string }>;

export default function HostFinanceSubPage({ params }: { params: Params }) {
  const { sub } = use(params);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg("Cập nhật thông tin thanh toán thành công! (Chế độ chạy thử)");
      setTimeout(() => setSuccessMsg(null), 5000);
    }, 1000);
  };

  const getSubConfig = () => {
    switch (sub) {
      case "payments":
        return {
          title: "Thông tin thanh toán & Nhận tiền",
          description: "Quản lý tài khoản ngân hàng đối tác để nhận thanh toán doanh thu tự động từ StaySaga.",
          icon: CreditCard,
          breadcrumb: "Nhận tiền",
          content: (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border border-slate-200 bg-white p-5 rounded-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#f60057]" />
                  Tài khoản ngân hàng nhận tiền
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Tên ngân hàng</label>
                    <select className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:outline-none focus:border-[#f60057]">
                      <option>Vietcombank - Ngân hàng Ngoại thương VN</option>
                      <option>Techcombank - Ngân hàng Kỹ thương VN</option>
                      <option>BIDV - Ngân hàng Đầu tư & Phát triển VN</option>
                      <option>Agribank - Ngân hàng Nông nghiệp & PTNT VN</option>
                      <option>Vietinbank - Ngân hàng Công thương VN</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Chi nhánh</label>
                    <input required defaultValue="Chi nhánh Hà Nội" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:outline-none focus:border-[#f60057]" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Số tài khoản ngân hàng</label>
                    <input required defaultValue="10294857201" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:outline-none focus:border-[#f60057]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Tên chủ tài khoản (Viết chữ hoa không dấu)</label>
                    <input required defaultValue="NGUYEN VAN A" className="h-11 w-full border border-slate-350 bg-white px-3 text-sm focus:outline-none focus:border-[#f60057]" />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-white p-5 rounded-sm space-y-3">
                <h3 className="font-bold text-slate-800">Phương thức thanh toán mặc định</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment_method" defaultChecked className="h-4 w-4 text-[#f60057]" />
                  <span className="text-sm font-semibold text-slate-700">Chuyển khoản ngân hàng trực tiếp (Bank Transfer)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment_method" className="h-4 w-4 text-[#f60057]" />
                  <span className="text-sm font-semibold text-slate-700">Ví điện tử MoMo đối tác</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 bg-[#f60057] px-6 font-bold text-white hover:bg-[#d9004c] disabled:bg-slate-300"
              >
                {loading ? "Đang lưu..." : "Cập nhật tài khoản nhận tiền"}
              </button>
            </form>
          ),
        };
      case "invoices":
        return {
          title: "Hóa đơn & Biên lai dịch vụ",
          description: "Tải xuống và quản lý hóa đơn hoa hồng dịch vụ phát sinh theo các chu kỳ đặt phòng.",
          icon: FileText,
          breadcrumb: "Hóa đơn",
          content: (
            <div className="space-y-6">
              <div className="border border-slate-200 bg-white p-5 rounded-sm space-y-4">
                <h3 className="font-bold text-slate-800">Hóa đơn phát sinh tháng trước</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold text-xs uppercase">
                        <th className="pb-3">Số hóa đơn</th>
                        <th className="pb-3">Kỳ thanh toán</th>
                        <th className="pb-3">Số tiền hoa hồng</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-right">Tải về</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-4">INV-202605-001</td>
                        <td className="py-4">01/05/2026 - 31/05/2026</td>
                        <td className="py-4">1.250.000 VND</td>
                        <td className="py-4 text-emerald-700">Đã thanh toán</td>
                        <td className="py-4 text-right">
                          <button onClick={() => alert("Hệ thống đang chuẩn bị tệp tải xuống...")} className="text-[#f60057] hover:underline font-bold">PDF</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4">INV-202604-012</td>
                        <td className="py-4">01/04/2026 - 30/04/2026</td>
                        <td className="py-4">850.000 VND</td>
                        <td className="py-4 text-emerald-700">Đã thanh toán</td>
                        <td className="py-4 text-right">
                          <button onClick={() => alert("Hệ thống đang chuẩn bị tệp tải xuống...")} className="text-[#f60057] hover:underline font-bold">PDF</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ),
        };
      default:
        return {
          title: "Tài chính đối tác",
          description: "Thông tin thanh toán và đối soát hóa đơn.",
          icon: Coins,
          breadcrumb: "Tài chính",
          content: <EmptyState isDeveloping />,
        };
    }
  };

  const config = getSubConfig();
  const Icon = config.icon;
  const userName = "Tài khoản đối tác";

  return (
    <HostExtranetShell active="finance" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: "Tài chính", href: "/host/finance" },
            { label: config.breadcrumb },
          ]}
        />

        {successMsg && (
          <div className="mb-6 border border-emerald-300 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="border border-slate-200 bg-white p-6 md:p-8 rounded-sm shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-[#f60057]">
              <Icon className="h-6 w-6 shrink-0" />
              <h2 className="text-xl font-bold">Chi tiết tài chính</h2>
            </div>
            {config.content}
          </div>

          <aside className="border border-slate-250 bg-white p-5 rounded-sm h-fit">
            <h4 className="font-bold text-sm text-slate-900">Tính bảo mật và an toàn</h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Mọi dữ liệu ngân hàng đối tác đều được StaySaga mã hóa và lưu trữ an toàn theo tiêu chuẩn bảo mật ngân hàng cao cấp. Doanh thu của bạn sẽ được bảo vệ tối đa.
            </p>
          </aside>
        </div>
      </main>
    </HostExtranetShell>
  );
}
