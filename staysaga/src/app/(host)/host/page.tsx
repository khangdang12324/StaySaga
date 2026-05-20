import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Home, Plus, Star, WalletCards } from "lucide-react";
import { HostExtranetShell } from "./_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
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
  invalid: "Thiếu tên, thành phố, địa chỉ hoặc giá mỗi đêm. Hãy kiểm tra lại biểu mẫu.",
  image_count: "Cần ít nhất 1 ảnh đại diện trước khi gửi duyệt.",
  image_type: "Chỉ hỗ trợ ảnh PNG, JPG, WEBP hoặc GIF.",
  image_size: "Có ảnh vượt quá dung lượng 5MB.",
  create_failed: "Chưa lưu được chỗ nghỉ vào Supabase. Hãy kiểm tra migration, RLS và service role key.",
  update_failed: "Chưa cập nhật được chỗ nghỉ.",
  status_update_failed: "Chưa cập nhật được trạng thái chỗ nghỉ.",
  not_found: "Không tìm thấy chỗ nghỉ.",
  forbidden: "Bạn không có quyền thao tác chỗ nghỉ này.",
  blocked_property: "Chỗ nghỉ đang bị khóa hoặc đã xóa mềm.",
  delete_pending: "Chỗ nghỉ đang chờ quản trị viên xử lý yêu cầu xóa.",
  delete_request_invalid: "Vui lòng nhập lý do xóa và xác nhận trước khi gửi yêu cầu.",
  checklist_incomplete: "Chưa đủ checklist để gửi duyệt. Cần có ảnh, phòng/loại căn và giá hợp lệ.",
  verification_incomplete: "Chưa đủ thông tin xác minh. Hãy nhập tên chủ sở hữu, số điện thoại và email liên hệ.",
};

export default async function HostDashboardPage({ searchParams }: HostPageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const params = await searchParams;
  const { listings, pendingBookings, totalRevenue, averageRating } = await getHostDashboardData();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";
  const activeListings = listings.filter((item) => item.status === "APPROVED" && item.is_active);
  const pendingListings = listings.filter((item) => item.status === "PENDING");
  const draftListings = listings.filter((item) => item.status === "DRAFT" || item.status === "REJECTED");

  const tasks = [
    { label: "Thêm ảnh chỗ nghỉ", done: listings.some((item) => (item.homestay_images?.length || 0) > 0) },
    { label: "Thêm tiện nghi", done: false },
    { label: "Thêm phòng/loại căn", done: listings.length > 0 },
    { label: "Cài giá", done: listings.some((item) => Number(item.price_per_night || 0) > 0) },
    { label: "Cài chính sách", done: listings.length > 0 },
    { label: "Gửi duyệt", done: listings.some((item) => item.status === "PENDING" || item.status === "APPROVED") },
  ];

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {successMessages[params.status || ""] && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
            {successMessages[params.status || ""]}
          </div>
        )}
        {params.error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 font-bold text-[#f60057]">
            {errorMessages[params.error] || "Chưa xử lý được thao tác. Vui lòng kiểm tra dữ liệu và cấu hình Supabase."}
          </div>
        )}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Tổng quan đối tác</h1>
            <p className="mt-2 text-slate-600">Quản lý chỗ nghỉ, checklist hoàn thiện và trạng thái duyệt trên StaySaga.</p>
          </div>
          <Link href="/host/properties/new" className="inline-flex items-center gap-2 rounded-lg bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004e]">
            <Plus className="h-5 w-5" />
            Thêm chỗ nghỉ mới
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric icon={<Home />} label="Tổng chỗ nghỉ" value={listings.length} />
          <Metric icon={<Home />} label="Đang hoạt động" value={activeListings.length} />
          <Metric icon={<CalendarDays />} label="Chờ duyệt" value={pendingListings.length} />
          <Metric icon={<CalendarDays />} label="Đơn đặt mới" value={pendingBookings} />
          <Metric icon={<Star />} label="Đánh giá trung bình" value={averageRating ? averageRating.toFixed(1) : "0"} />
          <Metric icon={<WalletCards />} label="Doanh thu tháng này" value={`VND ${Math.round(totalRevenue).toLocaleString("vi-VN")}`} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Chỗ nghỉ gần đây</h2>
              <Link href="/host/list" className="font-bold text-[#f60057]">Xem tất cả</Link>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {listings.slice(0, 5).map((listing) => (
                <Link key={listing.id} href={`/host/${listing.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-slate-50">
                  <div>
                    <p className="font-black">{listing.name || "Chỗ nghỉ chưa đặt tên"}</p>
                    <p className="text-sm text-slate-600">{listing.city || "Việt Nam"} · VND {Number(listing.price_per_night || 0).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className="rounded bg-rose-50 px-3 py-1 text-sm font-bold text-[#f60057]">{listing.status || "DRAFT"}</span>
                </Link>
              ))}
              {listings.length === 0 && (
                <div className="py-10 text-center text-slate-600">
                  <p className="font-bold">Chưa có chỗ nghỉ nào.</p>
                  <Link href="/host/properties/new" className="mt-4 inline-flex rounded-lg bg-[#f60057] px-5 py-3 font-bold text-white">Tạo chỗ nghỉ đầu tiên</Link>
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Việc cần hoàn tất</h2>
            <div className="mt-5 space-y-3">
              {tasks.map((task) => (
                <div key={task.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                  <span className="font-semibold">{task.label}</span>
                  <span className={`rounded px-2 py-1 text-xs font-bold ${task.done ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-[#f60057]"}`}>
                    {task.done ? "Xong" : "Cần làm"}
                  </span>
                </div>
              ))}
            </div>
            {draftListings.length > 0 && (
              <Link href="/host/list?status=draft" className="mt-5 inline-flex w-full justify-center rounded-lg border border-[#f60057] px-4 py-3 font-bold text-[#f60057] hover:bg-rose-50">
                Tiếp tục hoàn thiện nháp
              </Link>
            )}
          </aside>
        </section>
      </main>
    </HostExtranetShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[#f60057] [&>svg]:h-6 [&>svg]:w-6">{icon}</div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}
