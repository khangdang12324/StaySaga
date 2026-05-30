import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { getSiteSettings } from "@/core/site/actions";
import { updateWebsiteSettings } from "@/core/admin/actions";
import SafeImage from "@/components/ui/SafeImage";
import { Sparkles, Save, Info, Image as ImageIcon } from "lucide-react";

type SettingsPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};

  // Fetch all site settings
  const settings = await getSiteSettings();

  const brandName = settings.site_name || "StaySaga";
  const heroTitle =
    settings.hero_title || "Khám phá những điểm lưu trú tuyệt vời nhất";
  const heroSubtitle =
    settings.hero_subtitle ||
    "Đặt homestay, khách sạn và trải nghiệm nghỉ dưỡng tiện lợi.";
  const featuredDestinations =
    settings.featured_destinations || "da-lat,ha-noi,da-nang,saigon";
  const propertyTypes =
    settings.property_types || "Homestay, Khách sạn, Resort, Biệt thự, Căn hộ";
  const defaultAmenities =
    settings.default_amenities ||
    "Wifi, Điều hòa, Hồ bơi, Chỗ đỗ xe, Bếp, Máy giặt";
  const heroImage = settings.hero_image || "/images/hero-bg.jpg";

  return (
    <AdminShell
      title="Cài đặt Website"
      description="Quản lý thông tin chung, cấu hình giao diện trang chủ và tùy chỉnh các danh mục hệ thống."
      activePath="/admin/settings"
    >
      {params.status === "updated" && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-sm flex items-center gap-2">
          <Info className="h-5 w-5 text-emerald-600" />
          Đã cập nhật cấu hình hệ thống thành công!
        </div>
      )}
      {params.error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 shadow-sm flex items-center gap-2">
          <Info className="h-5 w-5 text-rose-600" />
          Không thể cập nhật cấu hình. Vui lòng kiểm tra lại quyền Supabase RLS.
          (Chế độ xem trước khả dụng)
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Config */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b pb-4">
              <Sparkles className="h-5 w-5 text-rose-500" /> Cấu hình Website
              Frontend
            </h3>

            <form action={updateWebsiteSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Tên thương hiệu (Website Name)
                  </label>
                  <input
                    name="site_name"
                    required
                    defaultValue={brandName}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Tiêu đề Homepage (Hero Title)
                  </label>
                  <input
                    name="hero_title"
                    required
                    defaultValue={heroTitle}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Mô tả Homepage (Hero Subtitle)
                </label>
                <textarea
                  name="hero_subtitle"
                  rows={3}
                  defaultValue={heroSubtitle}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-extrabold text-slate-900 mb-4">
                  Danh mục & Từ khóa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Thành phố nổi bật (Slugs)
                    </label>
                    <input
                      name="featured_destinations"
                      placeholder="ha-noi,da-lat,phu-quoc"
                      defaultValue={featuredDestinations}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-mono text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
                    />
                    <p className="mt-1.5 text-[10px] text-slate-500 leading-normal">
                      Cách nhau bằng dấu phẩy. Sử dụng slug viết liền không dấu.
                    </p>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Loại chỗ nghỉ
                    </label>
                    <input
                      name="property_types"
                      placeholder="Homestay, Khách sạn..."
                      defaultValue={propertyTypes}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
                    />
                    <p className="mt-1.5 text-[10px] text-slate-500 leading-normal">
                      Các loại chỗ nghỉ hiển thị khi đối tác tạo tin đăng mới.
                    </p>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Tiện nghi mặc định
                    </label>
                    <input
                      name="default_amenities"
                      placeholder="Wifi, Điều hòa..."
                      defaultValue={defaultAmenities}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all"
                    />
                    <p className="mt-1.5 text-[10px] text-slate-500 leading-normal">
                      Danh sách tiện nghi gợi ý phổ biến cho toàn bộ hệ thống.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Banner Trang chủ (Hero Background Image)
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      name="hero_image"
                      accept="image/*"
                      className="block w-full text-xs text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-xs file:font-black file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-900/10 hover:bg-rose-700 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-slate-400" /> Xem trước giao
              diện chính
            </h3>

            {/* Mock Homepage Hero */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-900 h-64 flex flex-col justify-between p-4 text-white">
              {heroImage ? (
                <div className="absolute inset-0 z-0">
                  <SafeImage
                    src={heroImage}
                    alt="Hero Banner Preview"
                    className="object-cover w-full h-full opacity-60"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/70 to-rose-700/70 z-0 flex items-center justify-center">
                  <span className="text-[10px] text-white/50 uppercase font-black tracking-widest">
                    Không có banner (Dùng màu gradient mặc định)
                  </span>
                </div>
              )}

              {/* Logo / Header strip */}
              <div className="relative z-10 flex justify-between items-center w-full">
                <span className="text-sm font-black tracking-tight">
                  {brandName}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              </div>

              {/* Main titles */}
              <div className="relative z-10 my-auto text-center">
                <h4 className="text-base font-black leading-tight max-w-[200px] mx-auto drop-shadow-md">
                  {heroTitle}
                </h4>
                <p className="text-[10px] text-white/80 mt-1.5 leading-normal max-w-[220px] mx-auto truncate">
                  {heroSubtitle}
                </p>
              </div>

              {/* Search Bar mockup */}
              <div className="relative z-10 bg-white/95 rounded p-1 shadow-md w-full flex items-center gap-2">
                <div className="flex-1 h-3 rounded bg-slate-200"></div>
                <div className="h-4 w-12 rounded bg-rose-600"></div>
              </div>
            </div>

            <div className="mt-4 border-t pt-4 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  Thành phố nổi bật
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {featuredDestinations.split(",").map((slug: string) => (
                    <span
                      key={slug}
                      className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                    >
                      {slug.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  Loại chỗ nghỉ hỗ trợ
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {propertyTypes.split(",").map((t: string) => (
                    <span
                      key={t}
                      className="text-[10px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded"
                    >
                      {t.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  Tiện nghi mặc định
                </p>
                <p className="text-xs text-slate-700 mt-1 leading-normal font-medium">
                  {defaultAmenities}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
