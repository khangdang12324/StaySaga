import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Settings,
  BarChart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { getSiteSettings, updateSiteSettings } from "@/core/site/actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const role = await getUserRole(supabase, session.user.id);
  if (role !== "admin") {
    redirect("/");
  }

  const settings = await getSiteSettings([
    "site_name",
    "hero_title",
    "hero_subtitle",
    "accent_color",
    "hero_image",
  ]);

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <span className="text-2xl font-black text-rose-600">
            {settings.site_name || "StaySaga"}.
          </span>
          <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded ml-2">
            ADMIN
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 bg-rose-50 px-4 py-3 rounded-xl font-medium text-gray-900"
          >
            <BarChart className="w-5 h-5" /> Tổng quan
          </Link>
          <Link
            href="/host"
            className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium"
          >
            <Home className="w-5 h-5" /> Quản lý homestay
          </Link>
          <Link
            href="#customize"
            className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium"
          >
            <Sparkles className="w-5 h-5" /> Tùy chỉnh website
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 bg-rose-50/40">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">
            Tùy chỉnh website
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Chỉ admin mới có quyền chỉnh nội dung chung của website, còn host
            chỉ quản lý listing của mình.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-500">Doanh thu</h3>
              <div className="rounded-lg bg-green-100 p-2 text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">124.500.000đ</p>
            <p className="mt-2 text-sm font-medium text-green-600">
              +12% so với tháng trước
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-500">Đơn đặt mới</h3>
              <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">45</p>
            <p className="mt-2 text-sm font-medium text-blue-600">
              +5% so với tháng trước
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-500">Homestay đang mở</h3>
              <div className="rounded-lg bg-rose-100 p-2 text-rose-600">
                <Home className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-500">Người dùng mới</h3>
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">128</p>
          </div>
        </div>

        <section
          id="customize"
          className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cấu hình website</h2>
              <p className="text-sm text-gray-500">
                Cập nhật nội dung homepage và tên thương hiệu hiển thị trên
                website.
              </p>
            </div>
          </div>

          <form
            action={updateSiteSettings}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tên website
              </span>
              <input
                name="site_name"
                defaultValue={settings.site_name || "StaySaga"}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Màu chủ đạo
              </span>
              <input
                name="accent_color"
                defaultValue={settings.accent_color || "rose"}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tiêu đề homepage
              </span>
              <input
                name="hero_title"
                defaultValue={
                  settings.hero_title ||
                  "Khám phá những điểm lưu trú tuyệt vời nhất"
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Mô tả homepage
              </span>
              <textarea
                name="hero_subtitle"
                defaultValue={
                  settings.hero_subtitle ||
                  "Đặt homestay, khách sạn và trải nghiệm nghỉ dưỡng theo phong cách Booking/Agoda với giao diện nhẹ, nhanh và rõ ràng."
                }
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ảnh chủ đề (Hero image)
              </span>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  name="hero_image"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700"
                />
                {settings.hero_image && (
                  <img
                    src={settings.hero_image}
                    alt="Hero preview"
                    className="w-36 h-20 rounded-lg object-cover border border-gray-100"
                  />
                )}
              </div>
            </label>
            <div className="md:col-span-2 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Thay đổi sẽ hiển thị ngay ở homepage sau khi lưu.
              </p>
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        </section>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-lg">Đơn đặt phòng gần đây</h2>
            <button className="text-sm font-medium text-rose-600">
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-rose-50 text-sm text-gray-500">
                  <th className="px-6 py-3 font-medium">Mã đơn</th>
                  <th className="px-6 py-3 font-medium">Khách hàng</th>
                  <th className="px-6 py-3 font-medium">Homestay</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr>
                  <td className="px-6 py-4 font-mono font-medium">#BK-9281</td>
                  <td className="px-6 py-4">Nguyễn Văn A</td>
                  <td className="px-6 py-4">Biệt thự biển ngắm hoàng hôn</td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Đã thanh toán
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">14.300.000đ</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono font-medium">#BK-9282</td>
                  <td className="px-6 py-4">Trần Thị B</td>
                  <td className="px-6 py-4">Cabin gỗ giữa đồi thông</td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      Chờ xác nhận
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">4.200.000đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
