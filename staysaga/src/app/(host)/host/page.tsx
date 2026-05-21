import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download,
  Eye,
  ListChecks,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Star,
  XCircle,
} from "lucide-react";
import { HostExtranetShell } from "./_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type HostPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

const successMessages: Record<string, string> = {
  created: "Đã gửi chỗ nghỉ để chờ duyệt.",
  updated: "Đã cập nhật chỗ nghỉ.",
  closed: "Đã tạm đóng chỗ nghỉ.",
  opened: "Đã mở lại chỗ nghỉ.",
  delete_requested: "Đã gửi yêu cầu xóa chỗ nghỉ đến quản trị viên.",
};

const errorMessages: Record<string, string> = {
  invalid:
    "Thiếu tên, thành phố, địa chỉ hoặc giá mỗi đêm. Hãy kiểm tra lại biểu mẫu.",
  image_count: "Cần ít nhất 1 ảnh đại diện trước khi gửi duyệt.",
  image_type: "Chỉ hỗ trợ ảnh PNG, JPG, WEBP hoặc GIF.",
  image_size: "Có ảnh vượt quá dung lượng 5MB.",
  create_failed:
    "Chưa lưu được chỗ nghỉ vào Supabase. Hãy kiểm tra migration, RLS và service role key.",
  update_failed: "Chưa cập nhật được chỗ nghỉ.",
  status_update_failed: "Chưa cập nhật được trạng thái chỗ nghỉ.",
  not_found: "Không tìm thấy chỗ nghỉ.",
  forbidden: "Bạn không có quyền thao tác chỗ nghỉ này.",
  blocked_property: "Chỗ nghỉ đang bị khóa hoặc đã xóa mềm.",
  delete_pending: "Chỗ nghỉ đang chờ quản trị viên xử lý yêu cầu xóa.",
  delete_request_invalid:
    "Vui lòng nhập lý do xóa và xác nhận trước khi gửi yêu cầu.",
  checklist_incomplete:
    "Chưa đủ checklist để gửi duyệt. Cần có ảnh, phòng/loại căn và giá hợp lệ.",
  verification_incomplete:
    "Chưa đủ thông tin xác minh. Hãy nhập tên chủ sở hữu, số điện thoại và email liên hệ.",
};

export default async function HostDashboardPage({
  searchParams,
}: HostPageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const params = await searchParams;
  const { listings, pendingBookings } = await getHostDashboardData();
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";
  const activeListings = listings.filter(
    (item) => item.status === "APPROVED" && item.is_active,
  );
  const inactiveListings = listings.filter(
    (item) => item.status !== "APPROVED" || !item.is_active,
  );
  const visibleListings = listings.slice(0, 2);
  const visibleInactiveListings = (
    inactiveListings.length ? inactiveListings : listings
  ).slice(0, 2);

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-[1180px] px-6 py-10">
        {successMessages[params.status || ""] ? (
          <div className="mb-6 border border-emerald-300 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            {successMessages[params.status || ""]}
          </div>
        ) : null}
        {params.error ? (
          <div className="mb-6 border border-rose-300 bg-rose-50 px-5 py-4 font-semibold text-rose-700">
            {errorMessages[params.error] ||
              "Chưa xử lý được thao tác. Vui lòng kiểm tra dữ liệu và cấu hình Supabase."}
          </div>
        ) : null}

        <div className="mb-7 flex items-center justify-between gap-6">
          <h1 className="text-[32px] font-bold">Trang chủ Nhóm chỗ nghỉ</h1>
          <Link
            href="/host/register?new=1"
            className="rounded-sm bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004c]"
          >
            Thêm chỗ nghỉ mới
          </Link>
        </div>

        <section className="border border-gray-300 bg-white p-6">
          <div className="flex gap-5">
            <MessageCircle className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h2 className="text-xl font-bold">
                Tiếp cận nhiều khách hơn với loại giá theo tuần và theo tháng
              </h2>
              <p className="mt-4">
                Tăng tỷ lệ lấp phòng và tiếp cận nhu cầu ngày càng tăng cho các
                kỳ nghỉ dài bằng cách tạo giá theo tuần hoặc theo tháng.
              </p>
              <Link
                href="/host/revenue"
                className="mt-5 inline-flex font-bold text-[#f60057]"
              >
                Thêm loại giá theo tháng
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              Chỗ nghỉ chưa có trên StaySaga ({visibleInactiveListings.length})
            </h2>
            <Link href="/host/list" className="font-medium text-[#f60057]">
              Xem tất cả
            </Link>
          </div>
          <p className="mt-7">
            Phát triển kinh doanh bằng cách thêm các chỗ nghỉ này vào nền tảng
            du lịch trực tuyến của StaySaga.
          </p>
          <div className="mt-6 overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-5 py-4 font-bold">Tên ↓</th>
                  <th className="px-5 py-4 font-bold">Vị trí</th>
                  <th className="px-5 py-4 font-bold">Tiến trình đăng ký</th>
                  <th className="px-5 py-4 font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visibleInactiveListings.map(
                  (listing) => {
                    const progress =
                      listing.status === "PENDING"
                        ? 90
                        : listing.status === "REJECTED"
                          ? 70
                          : 55;
                    return (
                      <tr key={listing.id} className="border-b border-gray-200">
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-4">
                            <span className="h-10 w-10 rounded-full bg-gray-700" />
                            <div>
                              <p className="font-bold">
                                {listing.name || "Chỗ nghỉ chưa đặt tên"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {listing.address || listing.city || "Việt Nam"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5">{listing.country || "Việt Nam"}</td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-[220px] rounded bg-gray-200">
                              <div
                                className="h-2 rounded bg-emerald-700"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-8">
                            <Link
                              href={`/host/${listing.id}`}
                              className="font-medium text-[#f60057] underline"
                            >
                              Tiếp tục đăng ký
                            </Link>
                            <Link
                              href={`/host/${listing.id}`}
                              className="inline-flex items-center gap-1 text-red-600"
                            >
                              Quản lý
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <p className="font-bold">Chưa có chỗ nghỉ nào.</p>
                      <Link
                        href="/host/register?new=1"
                        className="mt-4 inline-flex rounded-sm bg-[#f60057] px-5 py-3 font-bold text-white"
                      >
                        Tạo chỗ nghỉ đầu tiên
                      </Link>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Các chỗ nghỉ đang hoạt động</h2>
          <div className="mt-8 flex flex-wrap items-end gap-5">
            <label className="font-bold">
              Lọc theo vị trí
              <select className="mt-2 block h-11 w-[250px] border border-gray-500 bg-white px-3 font-normal">
                <option>{Math.min(activeListings.length || listings.length, 2)} chỗ nghỉ</option>
                <option>Việt Nam</option>
              </select>
            </label>
            <label className="relative block">
              <input
                placeholder="Lọc theo ID chỗ nghỉ, tên"
                className="h-11 w-[260px] border border-gray-500 bg-white px-3 pr-10"
              />
              <Search className="absolute right-3 top-3 h-5 w-5" />
            </label>
          </div>

          <div className="mt-8 flex gap-8 border-b border-gray-300">
            {["Hoạt động", "Hiệu suất", "Cài đặt", "Chỗ nghỉ mới thêm (1)"].map(
              (tab, index) => (
                <button
                  key={tab}
                  className={`pb-4 ${
                    index === 0
                      ? "border-b-2 border-[#f60057] text-[#f60057]"
                      : ""
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <h3 className="mt-7 text-2xl font-bold">Tổng quan hôm nay</h3>
          <div className="mt-7 grid border border-gray-300 bg-white md:grid-cols-5">
            <OverviewMetric icon={<ListChecks />} value={pendingBookings} label="Đặt phòng" />
            <OverviewMetric icon={<MessageCircle />} value={0} label="Khách đến" />
            <OverviewMetric icon={<MessageCircle />} value={0} label="Khách đi" />
            <OverviewMetric icon={<Star />} value={0} label="Đánh giá" />
            <OverviewMetric icon={<XCircle />} value={0} label="Lượt hủy" />
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-5">
            <label className="font-bold">
              Lọc theo trạng thái
              <select className="mt-2 block h-11 w-[260px] border border-gray-500 bg-white px-3 font-normal">
                <option>Tất cả chỗ nghỉ</option>
                <option>Mở / Có thể đặt phòng</option>
                <option>Đóng / Không thể đặt phòng</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-5 text-gray-600">
              <Link href="/host/list" className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Tải xuống
              </Link>
              <Link href="/host/list" className="inline-flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Tùy chỉnh dữ liệu
              </Link>
              <Link href="/host/list" className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Tùy chỉnh chế độ xem
              </Link>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-4 py-4">ID ↑</th>
                  <th className="px-4 py-4">Chỗ nghỉ</th>
                  <th className="px-4 py-4">Trạng thái trên StaySaga</th>
                  <th className="px-4 py-4">Đến trong 48 giờ tới</th>
                  <th className="px-4 py-4">Rời đi trong 48 giờ tới</th>
                  <th className="px-4 py-4">Tin nhắn từ khách</th>
                  <th className="px-4 py-4">Tin nhắn từ StaySaga</th>
                </tr>
              </thead>
              <tbody>
                {visibleListings.map((listing, index) => {
                  const open = listing.status === "APPROVED" && listing.is_active;
                  return (
                    <tr key={listing.id} className="border-b border-gray-200">
                      <td className="px-4 py-5">{listing.id.slice(0, 8)}</td>
                      <td className="px-4 py-5">
                        <p>{listing.name || "Chỗ nghỉ chưa đặt tên"}</p>
                        <p className="text-sm text-gray-500">
                          {listing.address || listing.city || "Việt Nam"}
                        </p>
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={`inline-flex items-center gap-2 ${
                            open ? "text-gray-800" : "text-red-600"
                          }`}
                        >
                          <span
                            className={`h-3 w-3 rounded-full ${
                              open ? "bg-emerald-700" : "border border-red-600"
                            }`}
                          />
                          {open
                            ? "Mở / Có thể đặt phòng"
                            : "Đóng / Không thể đặt phòng"}
                        </span>
                        {!open ? (
                          <Link
                            href={`/host/${listing.id}`}
                            className="mt-3 block text-[#f60057]"
                          >
                            Tìm hiểu nguyên nhân
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-5 text-center">0</td>
                      <td className="px-4 py-5 text-center">0</td>
                      <td className="px-4 py-5 text-center">0</td>
                      <td className="px-4 py-5 text-center">
                        {index === 1 ? (
                          <Link
                            href="/host/messages"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f60057] text-sm font-bold text-white"
                            aria-label="Xem 5 tin nhắn từ StaySaga"
                          >
                            5
                          </Link>
                        ) : (
                          0
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border border-[#f60057] bg-rose-50 px-6 py-5">
            Phản hồi của Quý vị rất quan trọng với chúng tôi. Quý vị thấy dữ liệu
            này có hữu ích không?
            <Link href="/help" className="ml-4 rounded-full bg-white px-3 py-2">
              Hữu ích
            </Link>
            <Link href="/help" className="ml-2 rounded-full bg-white px-3 py-2">
              Góp ý
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-10 bg-[#f60057] text-white">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 px-6 py-9">
          <div className="flex flex-wrap gap-8">
            <Link href="/help">Giới thiệu về chúng tôi</Link>
            <Link href="/settings">Chính sách Bảo mật và Cookie</Link>
            <Link href="/help">Các Câu Hỏi Thường Gặp</Link>
          </div>
          <div className="flex gap-4">
            <Link
              href="/host/register?new=1"
              className="rounded-sm bg-white/15 px-5 py-3 font-bold ring-1 ring-white/25"
            >
              Thêm chỗ nghỉ mới
            </Link>
            <Link href="/help" className="rounded-sm bg-white/15 px-5 py-3 font-bold ring-1 ring-white/25">
              Chia sẻ góp ý của Quý vị
            </Link>
          </div>
          <p className="w-full text-sm">© Bản quyền StaySaga 2026</p>
        </div>
      </footer>
    </HostExtranetShell>
  );
}

function OverviewMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="border-b border-gray-300 p-7 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="text-gray-900 [&>svg]:h-7 [&>svg]:w-7">{icon}</div>
      <p className="mt-7 text-2xl font-bold">{value}</p>
      <p className="mt-4 text-lg text-[#f60057]">{label}</p>
    </div>
  );
}
