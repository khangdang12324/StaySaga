import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  Globe2,
  Home,
  Plus,
  Search,
  Settings2,
  Star,
  Trash2,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { HostExtranetShell } from "./_components/HostExtranetShell";
import { getHostDashboardData, type HostListing } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { getLocationImage } from "@/lib/images/location-images";
import { createClient } from "@/lib/supabase/server";

type HostPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    error?: string;
  }>;
};

function getImage(listing: HostListing) {
  return listing.homestay_images?.[0]?.url || getLocationImage(listing.city);
}

function isOpenListing(listing: HostListing) {
  return listing.is_active && (!listing.status || listing.status === "APPROVED");
}

function isDraftListing(listing: HostListing) {
  return listing.status === "PENDING" || !listing.name;
}

function getListingName(listing: HostListing) {
  return listing.name || "Chỗ nghỉ chưa đặt tên";
}

function matchesQuery(listing: HostListing, query: string) {
  if (!query) return true;
  const value = `${listing.id} ${listing.name} ${listing.city} ${listing.address || ""}`.toLowerCase();
  return value.includes(query.toLowerCase());
}

function matchesStatus(listing: HostListing, status: string) {
  if (status === "open") return isOpenListing(listing);
  if (status === "closed") return !listing.is_active;
  if (status === "draft") return isDraftListing(listing);
  return true;
}

export default async function HostDashboardPage({ searchParams }: HostPageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login?next=/host");
  }

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );

  if (!canAccessPartner(role)) {
    redirect("/host/onboard");
  }

  const params = await searchParams;
  const statusFilter = params.status || "all";
  const query = params.q || "";

  const { listings, pendingBookings, averageRating } = await getHostDashboardData();
  const draftListings = listings.filter(isDraftListing);
  const openListings = listings.filter(isOpenListing);
  const visibleListings = listings.filter(
    (listing) => matchesStatus(listing, statusFilter) && matchesQuery(listing, query),
  );
  const primaryCity = openListings[0]?.city || listings[0]?.city || "Việt Nam";
  const userName =
    session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  const todayStats = [
    { icon: <CalendarDays className="h-7 w-7" />, value: pendingBookings, label: "Đặt phòng" },
    { icon: <Home className="h-7 w-7" />, value: 0, label: "Khách đến" },
    { icon: <Home className="h-7 w-7 rotate-180" />, value: 0, label: "Khách đi" },
    { icon: <Star className="h-7 w-7" />, value: Math.round(averageRating), label: "Đánh giá" },
    { icon: <Trash2 className="h-7 w-7" />, value: 0, label: "Lượt hủy" },
  ];

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {params.status === "created" && (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
            Chỗ nghỉ đã được lưu vào tài khoản của Quý vị và hiển thị trong danh sách bên dưới.
          </div>
        )}
        {params.error && (
          <div className="mb-6 border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-[#f60057]">
            Chưa lưu được chỗ nghỉ. Vui lòng kiểm tra quyền PARTNER, dữ liệu bắt buộc hoặc cấu hình Supabase.
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black">Trang chủ Nhóm chỗ nghỉ</h1>
          <Link
            href="/host/register"
            className="inline-flex items-center gap-2 rounded bg-[#f60057] px-5 py-3 text-sm font-bold text-white"
          >
            <Plus className="h-5 w-5" /> Thêm chỗ nghỉ mới
          </Link>
        </div>

        <section className="mb-10 border border-slate-200 bg-white p-6">
          <div className="flex gap-5">
            <Globe2 className="mt-1 h-8 w-8 text-slate-700" />
            <div>
              <h2 className="text-xl font-black">
                Tiếp cận nhiều khách hơn với loại giá theo tuần và theo tháng
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-800">
                Tăng tỷ lệ lấp phòng và tiếp cận nhu cầu lưu trú dài ngày bằng cách tạo giá theo tuần hoặc theo tháng cho chỗ nghỉ của Quý vị.
              </p>
              <Link href="/host/revenue" className="mt-6 inline-block text-base font-bold text-[#f60057]">
                Thêm loại giá theo tháng
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">
              Chỗ nghỉ chưa có trên StaySaga ({draftListings.length})
            </h2>
            <button className="text-sm font-bold text-[#f60057]">Ẩn mục</button>
          </div>
          <p className="mb-6 text-base text-slate-800">
            Các chỗ nghỉ đang trong quá trình đăng ký sẽ xuất hiện ở đây để Quý vị tiếp tục hoàn tất.
          </p>
          <div className="overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-base font-bold">Tên</th>
                  <th className="px-5 py-4 text-base font-bold">Vị trí</th>
                  <th className="px-5 py-4 text-base font-bold">Tiến trình đăng ký</th>
                  <th className="px-5 py-4 text-base font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {draftListings.length > 0 ? (
                  draftListings.map((listing) => (
                    <tr key={listing.id} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-5 py-5 font-bold">{getListingName(listing)}</td>
                      <td className="px-5 py-5">{listing.city || "Việt Nam"}</td>
                      <td className="px-5 py-5">
                        <div className="flex max-w-xs items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-slate-100">
                            <div className="h-full w-1/3 rounded-full bg-[#f60057]" />
                          </div>
                          <span className="font-semibold text-slate-600">35%</span>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <Link href="/host/register" className="mr-5 font-bold text-[#f60057]">
                          Tiếp tục đăng ký
                        </Link>
                        <button className="font-bold text-[#f60057]">Xóa</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center font-medium text-slate-600">
                      Không có chỗ nghỉ nào đang chờ hoàn tất.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-black">Các chỗ nghỉ đang hoạt động</h2>
          <form className="mt-6 flex flex-wrap items-end gap-4">
            <label>
              <span className="mb-2 block font-bold">Lọc theo vị trí</span>
              <button type="button" className="flex min-w-64 items-center justify-between border border-slate-400 bg-white px-4 py-3 text-left">
                {openListings.length} chỗ nghỉ ở {primaryCity}
                <ChevronDown className="h-5 w-5" />
              </button>
            </label>
            <label>
              <span className="mb-2 block font-bold">Tìm kiếm</span>
              <div className="flex border border-slate-400 bg-white">
                <input
                  name="q"
                  defaultValue={query}
                  className="w-72 px-4 py-3 font-medium outline-none"
                  placeholder="Lọc theo ID chỗ nghỉ, tên hoặc vị trí"
                />
                <button className="px-3" aria-label="Tìm kiếm">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </label>
          </form>
        </section>

        <section className="mb-10 border border-slate-200 bg-white p-8">
          <h2 className="mb-8 text-2xl font-black">Tổng quan hôm nay</h2>
          <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-5 md:divide-x md:divide-y-0">
            {todayStats.map((stat) => (
              <div key={stat.label} className="px-6 py-4">
                <div className="mb-7 text-slate-800">{stat.icon}</div>
                <p className="text-3xl font-black">{stat.value}</p>
                <p className="mt-4 text-lg font-medium text-[#f60057]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <form className="flex flex-wrap items-end gap-4">
              <input type="hidden" name="q" value={query} />
              <label>
                <span className="mb-2 block font-bold">Lọc theo trạng thái</span>
                <select
                  name="status"
                  defaultValue={statusFilter}
                  className="min-w-64 border border-slate-400 bg-white px-4 py-3 font-semibold"
                >
                  <option value="all">Tất cả chỗ nghỉ</option>
                  <option value="open">Mở / Có thể đặt phòng</option>
                  <option value="closed">Đóng / Không thể đặt phòng</option>
                  <option value="draft">Đang hoàn tất đăng ký</option>
                </select>
              </label>
              <button className="rounded bg-[#f60057] px-5 py-3 font-bold text-white">Áp dụng</button>
            </form>
            <div className="flex gap-7 text-sm font-bold text-slate-700">
              <button className="flex items-center gap-2">
                <Download className="h-5 w-5" /> Tải xuống
              </button>
              <button className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" /> Tùy chỉnh dữ liệu
              </button>
              <button className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Tùy chỉnh chế độ xem
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 text-base font-black">ID</th>
                  <th className="px-4 py-4 text-base font-black">Chỗ nghỉ</th>
                  <th className="px-4 py-4 text-base font-black">Trạng thái trên StaySaga</th>
                  <th className="px-4 py-4 text-base font-black">Đến trong 48 giờ tới</th>
                  <th className="px-4 py-4 text-base font-black">Rời đi trong 48 giờ tới</th>
                  <th className="px-4 py-4 text-base font-black">Tin nhắn từ khách</th>
                  <th className="px-4 py-4 text-base font-black">Tin nhắn từ StaySaga</th>
                </tr>
              </thead>
              <tbody>
                {visibleListings.map((listing) => (
                  <tr key={listing.id} className="border-b border-slate-200 last:border-b-0">
                    <td className="px-4 py-5 text-base">{listing.id.slice(0, 8)}</td>
                    <td className="px-4 py-5">
                      <Link href={`/host/${listing.id}`} className="flex gap-3 hover:text-[#f60057]">
                        <SafeImage
                          src={getImage(listing)}
                          alt={getListingName(listing)}
                          width={76}
                          height={56}
                          className="h-14 w-20 object-cover"
                        />
                        <span>
                          <span className="block text-base font-bold">{getListingName(listing)}</span>
                          <span className="mt-1 block text-sm text-slate-600">
                            {listing.address || listing.city}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-5">
                      {isOpenListing(listing) ? (
                        <span className="font-bold text-emerald-700">Mở / Có thể đặt phòng</span>
                      ) : (
                        <span className="font-bold text-[#f60057]">Đóng / Không thể đặt phòng</span>
                      )}
                    </td>
                    <td className="px-4 py-5 text-center text-base">0</td>
                    <td className="px-4 py-5 text-center text-base">0</td>
                    <td className="px-4 py-5 text-center text-base">0</td>
                    <td className="px-4 py-5 text-center text-base">0</td>
                  </tr>
                ))}
                {visibleListings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center font-medium text-slate-600">
                      Không có chỗ nghỉ phù hợp bộ lọc. Hãy thêm chỗ nghỉ mới hoặc xóa bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </HostExtranetShell>
  );
}
