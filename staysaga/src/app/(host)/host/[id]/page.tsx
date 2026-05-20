import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  Home,
  Mail,
  Megaphone,
  Search,
  Star,
  Tag,
  WalletCards,
} from "lucide-react";
import { PartnerPropertyActions } from "../_components/PartnerPropertyActions";
import { HostAccountMenu } from "../_components/HostAccountMenu";
import { PROPERTY_STATUS_LABELS, isBookableProperty, isPropertyStatus, type PropertyStatus } from "@/core/properties/status";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("vi-VN");

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string; error?: string }>;
};

type ListingDetail = {
  id: string;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  price_per_night?: number | string | null;
  max_guests?: number | string | null;
  bedrooms?: number | string | null;
  beds?: number | string | null;
  bathrooms?: number | string | null;
  is_active?: boolean | null;
  status?: string | null;
  delete_reason?: string | null;
  suspended_reason?: string | null;
  homestay_images?: { id?: string; url?: string | null }[] | null;
};

const pageMessages: Record<string, string> = {
  closed: "Chỗ nghỉ đã được tạm đóng và không còn hiển thị public.",
  opened: "Chỗ nghỉ đã được mở lại.",
  delete_requested: "Yêu cầu xóa chỗ nghỉ đã được gửi đến quản trị viên.",
};

export default async function PropertyDashboardPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const resolvedParams = await params;
  const withoutStorage = "*, homestay_images(id, url)";
  let { data: listing } = await supabase
    .from("homestays")
    .select(withoutStorage)
    .eq("id", resolvedParams.id)
    .eq("owner_id", session.user.id)
    .single();

  if (!listing) {
    const adminSupabase = await createAdminClient();
    const retry = await adminSupabase
      .from("homestays")
      .select(withoutStorage)
      .eq("id", resolvedParams.id)
      .eq("owner_id", session.user.id)
      .single();
    listing = retry.data;
  }

  if (!listing) notFound();

  const detail = listing as ListingDetail;
  const pageParams = searchParams ? await searchParams : {};
  const rawStatus = detail.status || "";
  const propertyStatus: PropertyStatus = isPropertyStatus(rawStatus) ? rawStatus : "APPROVED";
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";
  const images = Array.isArray(detail.homestay_images) ? detail.homestay_images : [];
  const isOpen = isBookableProperty(propertyStatus, Boolean(detail.is_active));
  const setupDone = [
    Boolean(detail.name),
    Boolean(detail.address),
    Number(detail.price_per_night || 0) > 0,
    images.length >= 4,
  ].filter(Boolean).length;
  const name = detail.name || "Chỗ nghỉ chưa đặt tên";
  const city = detail.city || "Việt Nam";

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-slate-950">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/host" className="text-3xl font-black">
            StaySaga<span>.</span>
          </Link>
          <span className="h-8 w-px bg-white/35" />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{name}</p>
            <p className="text-sm text-white/80">ID {String(detail.id).slice(0, 8)}</p>
          </div>
          {detail.slug && (
            <Link
              href={`/homestays/${detail.slug}`}
              className="hidden items-center gap-2 rounded border border-white/40 px-3 py-2 text-sm font-bold hover:bg-white/10 md:inline-flex"
            >
              <Eye className="h-4 w-4" />
              Xem public
            </Link>
          )}
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
          {pageMessages[pageParams.status || ""] && (
            <div className="border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
              {pageMessages[pageParams.status || ""]}
            </div>
          )}

          {propertyStatus === "SUSPENDED" && (
            <Notice
              tone="danger"
              title="Chỗ nghỉ đã bị khóa bởi quản trị viên"
              description={detail.suspended_reason || "Đối tác không thể tự mở lại chỗ nghỉ này. Vui lòng liên hệ quản trị viên để được hỗ trợ."}
              action="Liên hệ hỗ trợ"
            />
          )}
          {propertyStatus === "DELETE_REQUESTED" && (
            <Notice
              tone="warning"
              title="Đang chờ xử lý yêu cầu xóa"
              description={detail.delete_reason || "Yêu cầu xóa của Quý vị đang chờ quản trị viên xem xét."}
              action="Theo dõi trạng thái"
            />
          )}
          {!isOpen && propertyStatus !== "DELETE_REQUESTED" && propertyStatus !== "SUSPENDED" && (
            <Notice
              tone="danger"
              title="Chỗ nghỉ đang không hiển thị public"
              description="Khách chỉ có thể đặt chỗ nghỉ khi trạng thái là Đã duyệt và đang hoạt động."
              action="Kiểm tra trạng thái"
            />
          )}

          <section>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black">{name}</h1>
              <span className={`rounded px-3 py-1 text-sm font-bold text-white ${isOpen ? "bg-emerald-600" : "bg-[#f60057]"}`}>
                {PROPERTY_STATUS_LABELS[propertyStatus]}
              </span>
            </div>
            <p className="mt-2 text-slate-700">{detail.address || "Chưa có địa chỉ"} · {city}</p>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Thiết lập cơ bản ({setupDone} / 4 đã hoàn tất)</h2>
            <div className="mt-6 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#f60057]" style={{ width: `${setupDone * 25}%` }} />
            </div>
            <div className="mt-6 divide-y divide-slate-200">
              <SetupRow done={Boolean(detail.name)} title="Đặt tên chỗ nghỉ" action="Chỉnh sửa tên" />
              <SetupRow done={Boolean(detail.address)} title="Cập nhật địa chỉ và bản đồ" action="Cập nhật địa chỉ" />
              <SetupRow done={Number(detail.price_per_night || 0) > 0} title="Cài đặt giá mỗi đêm" action="Cập nhật giá" />
              <SetupRow done={images.length >= 4} title="Thêm tối thiểu 4 ảnh chỗ nghỉ" action="Thêm ảnh" />
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Quản lý trạng thái chỗ nghỉ</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tạm đóng sẽ ẩn chỗ nghỉ khỏi public nhưng không hủy booking hiện có. Xóa vĩnh viễn cần admin duyệt và chỉ là xóa mềm.
            </p>
            <div className="mt-5">
              <PartnerPropertyActions propertyId={detail.id} status={propertyStatus} isActive={Boolean(detail.is_active)} />
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Tổng quan chỗ nghỉ</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Metric value={`VND ${currency.format(Number(detail.price_per_night || 0))}`} label="Giá mỗi đêm" />
              <Metric value={String(detail.max_guests || 0)} label="Khách tối đa" />
              <Metric value={String(detail.bedrooms || 0)} label="Phòng ngủ" />
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
          <p className="mb-8 text-sm text-slate-600">Thông báo sẽ hiển thị tại đây khi có nhiệm vụ mới.</p>
          <Suggestion title="Tăng số đơn đặt với ưu đãi theo mùa" action="Kích hoạt ưu đãi" />
          <Suggestion title="Cập nhật thông tin liên hệ để hỗ trợ khách tốt hơn" action="Cập nhật thông tin" />
          <Suggestion title="Thêm ảnh chỗ nghỉ để tăng độ tin cậy" action="Thêm ảnh" />
          <Suggestion title="Đồng bộ hóa phòng trống giữa các kênh" action="Đồng bộ hóa" />
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
