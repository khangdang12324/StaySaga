import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Home,
  Mail,
  Megaphone,
  Search,
  Star,
  Tag,
  WalletCards,
} from "lucide-react";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { HostAccountMenu } from "../_components/HostAccountMenu";

const currency = new Intl.NumberFormat("vi-VN");

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDashboardPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const resolvedParams = await params;
  const { data: listing } = await supabase
    .from("homestays")
    .select("*, homestay_images(id, url, storage_path)")
    .eq("id", resolvedParams.id)
    .eq("owner_id", session.user.id)
    .single();

  if (!listing) notFound();

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";
  const images = Array.isArray(listing.homestay_images) ? listing.homestay_images : [];
  const isOpen = Boolean(listing.is_active) && listing.status !== "REJECTED";
  const setupDone = [
    Boolean(listing.name),
    Boolean(listing.address),
    Number(listing.price_per_night || 0) > 0,
    images.length >= 4,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-slate-950">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/host" className="text-3xl font-black">
            StaySaga<span>.</span>
          </Link>
          <span className="h-8 w-px bg-white/35" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{listing.name}</p>
            <p className="text-sm text-white/80">ID {String(listing.id).slice(0, 8)}</p>
          </div>
          <div className="ml-auto hidden h-12 min-w-[360px] items-center rounded bg-white/10 px-4 md:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-[#d9004e] px-3 py-1 text-sm font-bold ring-1 ring-white/30">VN</span>
          <HostAccountMenu userName={userName} />
        </div>
        <nav className="border-t border-white/10">
          <div className="no-scrollbar mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <NavItem active icon={<Home className="h-6 w-6" />} label="Trang chủ" />
            <NavItem icon={<CalendarDays className="h-6 w-6" />} label="Giá & Tình trạng phòng trống" />
            <NavItem icon={<Tag className="h-6 w-6" />} label="Chương trình khuyến mãi" dropdown />
            <NavItem icon={<CalendarDays className="h-6 w-6" />} label="Đặt phòng" />
            <NavItem icon={<Home className="h-6 w-6" />} label="Chỗ nghỉ" dropdown />
            <NavItem icon={<Megaphone className="h-6 w-6" />} label="Thúc đẩy hiệu suất" dropdown />
            <NavItem icon={<Mail className="h-6 w-6" />} label="Hộp thư" dropdown />
            <NavItem icon={<Star className="h-6 w-6" />} label="Đánh giá của khách" dropdown />
            <NavItem icon={<WalletCards className="h-6 w-6" />} label="Tài chính" dropdown />
            <NavItem icon={<BarChart3 className="h-6 w-6" />} label="Phân tích" dropdown />
          </div>
        </nav>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-6">
          <Notice
            tone="warning"
            title="Cập nhật quan trọng"
            description="Hãy kiểm tra lại chính sách hủy và thông tin liên hệ để khách luôn nhận được thông báo chính xác."
            action="Tìm hiểu thêm"
          />
          {!isOpen && (
            <Notice
              tone="danger"
              title="Chỗ nghỉ đang đóng / không thể đặt phòng"
              description="Khách chỉ có thể đặt chỗ nghỉ khi Quý vị bật trạng thái hoạt động và hoàn tất các thiết lập cần thiết."
              action="Kiểm tra trạng thái"
            />
          )}

          <section>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black">{listing.name}</h1>
              <span className={`rounded px-3 py-1 text-sm font-bold text-white ${isOpen ? "bg-emerald-600" : "bg-[#f60057]"}`}>
                {isOpen ? "Mở / Có thể đặt phòng" : "Đóng / Không thể đặt phòng"}
              </span>
            </div>
            <p className="mt-2 text-slate-700">{listing.address || "Chưa có địa chỉ"} · {listing.city || "Việt Nam"}</p>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Thiết lập cơ bản ({setupDone} / 4 đã hoàn tất)</h2>
            <div className="mt-6 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#f60057]" style={{ width: `${setupDone * 25}%` }} />
            </div>
            <div className="mt-6 divide-y divide-slate-200">
              <SetupRow done={Boolean(listing.name)} title="Đặt tên chỗ nghỉ" action="Chỉnh sửa tên" />
              <SetupRow done={Boolean(listing.address)} title="Cập nhật địa chỉ và bản đồ" action="Cập nhật địa chỉ" />
              <SetupRow done={Number(listing.price_per_night || 0) > 0} title="Cài đặt giá mỗi đêm" action="Cập nhật giá" />
              <SetupRow done={images.length >= 4} title="Thêm tối thiểu 4 ảnh chỗ nghỉ" action="Thêm ảnh" />
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Tổng quan chỗ nghỉ</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Metric value={`VND ${currency.format(Number(listing.price_per_night || 0))}`} label="Giá mỗi đêm" />
              <Metric value={String(listing.max_guests || 0)} label="Khách tối đa" />
              <Metric value={String(listing.bedrooms || 0)} label="Phòng ngủ" />
              <Metric value={String(images.length)} label="Ảnh đã lưu" />
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Hiệu suất kết quả tìm kiếm</h2>
            <p className="mt-1 text-slate-600">Trong 30 ngày qua</p>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <Metric value="1" label="Lượt xem trên kết quả tìm kiếm" />
              <Metric value="14" label="Lượt xem trang chỗ nghỉ" />
              <Metric value="0" label="Đặt phòng đã nhận" />
            </div>
          </section>
        </div>

        <aside className="space-y-0 border-l border-slate-300 bg-white lg:-my-8 lg:p-6">
          <h2 className="mb-6 text-2xl font-black">Đang chờ xử lý</h2>
          <p className="mb-8 text-sm text-slate-600">Hoàn tất thông báo sẽ hiển thị tại đây khi có nhiệm vụ mới.</p>
          <Suggestion title="Số đơn đặt tăng thêm đến 36% với ưu đãi mùa du lịch" action="Kích hoạt ưu đãi" />
          <Suggestion title="Cập nhật thông tin liên hệ mới giúp hỗ trợ khách tốt hơn" action="Cập nhật thông tin liên hệ" />
          <Suggestion title="Thêm nôi/cũi để tăng đặt phòng từ khách gia đình" action="Thêm ngay" />
          <Suggestion title="Đồng bộ hóa phòng trống giữa các kênh" action="Đồng bộ hóa phòng trống" />
        </aside>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, dropdown }: { icon: ReactNode; label: string; active?: boolean; dropdown?: boolean }) {
  return (
    <button className={`flex min-w-fit flex-col items-center gap-1 px-5 py-4 text-sm font-semibold hover:bg-white/10 ${active ? "bg-white/10 shadow-[inset_0_-4px_0_#fff]" : ""}`}>
      {icon}
      <span className="flex items-center gap-1">
        {label}
        {dropdown && <ChevronDown className="h-4 w-4" />}
      </span>
    </button>
  );
}

function Notice({ tone, title, description, action }: { tone: "warning" | "danger"; title: string; description: string; action: string }) {
  const classes =
    tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-rose-300 bg-rose-50 text-[#f60057]";
  return (
    <div className={`border p-6 ${classes}`}>
      <div className="flex gap-4">
        <AlertCircle className="mt-1 h-6 w-6 shrink-0" />
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-3 text-slate-800">{description}</p>
          <button className="mt-5 font-bold text-[#f60057]">{action}</button>
        </div>
      </div>
    </div>
  );
}

function SetupRow({ done, title, action }: { done: boolean; title: string; action: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-5">
      {done ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <AlertCircle className="h-6 w-6 text-[#f60057]" />}
      <p className={`flex-1 text-lg font-bold ${done ? "text-emerald-700" : "text-slate-950"}`}>{title}</p>
      {!done && <button className="border border-[#f60057] px-5 py-2 font-bold text-[#f60057]">{action}</button>}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}

function Suggestion({ title, action }: { title: string; action: string }) {
  return (
    <div className="border-t border-slate-200 py-6">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-3 text-sm text-slate-700">Đề xuất dựa trên dữ liệu vận hành của chỗ nghỉ và hành vi khách trên StaySaga.</p>
      <button className="mt-4 font-bold text-[#f60057]">{action}</button>
    </div>
  );
}
