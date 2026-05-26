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
import {
  isBookableProperty,
  isPropertyStatus,
  type PropertyStatus,
} from "@/core/properties/status";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
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
  country?: string | null;
  price_per_night?: number | string | null;
  max_guests?: number | string | null;
  bedrooms?: number | string | null;
  beds?: number | string | null;
  bathrooms?: number | string | null;
  is_active?: boolean | null;
  status?: string | null;
  rejection_reason?: string | null;
  delete_reason?: string | null;
  suspended_reason?: string | null;
  homestay_images?: { id?: string; url?: string | null }[] | null;
};

const statusLabels: Record<PropertyStatus, string> = {
  DRAFT: "Đang nháp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  HIDDEN: "Đã ẩn",
  SUSPENDED: "Bị khóa",
  CLOSED_TEMP: "Tạm đóng",
  DELETE_REQUESTED: "Đã yêu cầu xóa",
  DELETED: "Đã xóa mềm",
};

const pageMessages: Record<string, string> = {
  closed: "Chỗ nghỉ đã được tạm đóng và không còn hiển thị public.",
  opened: "Chỗ nghỉ đã được mở lại.",
  delete_requested: "Yêu cầu xóa chỗ nghỉ đã được gửi đến quản trị viên.",
};

export default async function PropertyDashboardPage({
  params,
  searchParams,
}: Props) {
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

  const { id } = await params;
  const adminSupabase = await createAdminClient();
  const select = "*, homestay_images(id, url)";
  const { data: listing } = await adminSupabase
    .from("homestays")
    .select(select)
    .eq("id", id)
    .eq("owner_id", session.user.id)
    .single();

  if (!listing) notFound();

  const detail = listing as ListingDetail;
  const pageParams = searchParams ? await searchParams : {};
  const rawStatus = detail.status || "";
  const propertyStatus: PropertyStatus = isPropertyStatus(rawStatus)
    ? rawStatus
    : "APPROVED";
  const images = Array.isArray(detail.homestay_images)
    ? detail.homestay_images
    : [];
  const isOpen = isBookableProperty(propertyStatus, Boolean(detail.is_active));
  const name = detail.name || "Chỗ nghỉ chưa đặt tên";
  const city = detail.city || detail.country || "Việt Nam";
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";
  const setupItems = [
    {
      done: false,
      title:
        "Đồng bộ hóa phòng trống giữa các trang web để tránh tình trạng quá tải đặt phòng",
      action: "Đồng bộ hóa phòng trống",
      href: `/host/${detail.id}/sync`,
    },
    {
      done: images.length >= 4,
      title: "Thêm tiện nghi phòng",
      action: "Thêm tiện nghi phòng",
      href: `/host/${detail.id}/amenities`,
    },
    {
      done: Number(detail.price_per_night || 0) > 0,
      title: "Thêm các tiện nghi và dịch vụ của chỗ nghỉ",
      action: "Cập nhật tiện nghi",
    },
    {
      done: Boolean(detail.address),
      title: "Xem trước trang chỗ nghỉ",
      action: "Xem trước",
      href: detail.slug ? `/homestays/${detail.slug}` : undefined,
    },
  ];
  const setupDone = setupItems.filter((item) => item.done).length;

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
          <Link href="/host" className="text-3xl font-bold tracking-tight">
            StaySaga
          </Link>
          <span className="hidden h-8 w-px bg-white/35 md:block" />
          <div className="hidden min-w-0 md:block">
            <p className="truncate font-bold">{name}</p>
            <p className="text-sm text-white/80">ID {detail.id.slice(0, 8)}</p>
          </div>
          {detail.slug ? (
            <Link
              href={`/homestays/${detail.slug}`}
              className="hidden items-center gap-2 rounded-sm border border-white/45 px-3 py-2 text-sm font-bold hover:bg-white/10 lg:inline-flex"
            >
              <Eye className="h-4 w-4" />
              Xem public
            </Link>
          ) : null}
          <div className="ml-auto hidden h-12 w-full max-w-[540px] items-center rounded-sm bg-white/10 px-4 ring-1 ring-white/10 lg:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <span className="hidden rounded-full bg-white/15 px-3 py-1 text-sm font-bold ring-1 ring-white/25 md:inline-flex">
            VN
          </span>
          <HostAccountMenu userName={userName} />
        </div>
        <nav className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1400px] overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <NavItem active icon={<Home />} label="Trang chủ" />
            <NavItem
              icon={<CalendarDays />}
              label="Giá & Tình trạng phòng trống"
              dropdown
              href={`/host/${detail.id}/calendar`}
            />
            <NavItem icon={<Tag />} label="Chương trình khuyến mãi" dropdown href={`/host/${detail.id}/promotions`} />
            <NavItem icon={<CalendarDays />} label="Đặt phòng" />
            <NavItem icon={<Home />} label="Chỗ nghỉ" dropdown />
            <NavItem icon={<Megaphone />} label="Thúc đẩy hiệu suất" dropdown />
            <NavItem icon={<Mail />} label="Hộp thư" dropdown badge={5} />
            <NavItem icon={<Star />} label="Đánh giá của khách" dropdown />
            <NavItem icon={<WalletCards />} label="Tài chính" dropdown />
            <NavItem icon={<BarChart3 />} label="Phân tích" dropdown />
          </div>
        </nav>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {pageMessages[pageParams.status || ""] ? (
            <div className="border border-rose-300 bg-rose-50 px-5 py-4 font-bold text-[#f60057]">
              {pageMessages[pageParams.status || ""]}
            </div>
          ) : null}

          <Notice
            tone="warning"
            title="Cập nhật quan trọng"
            description="Quý vị nên kiểm tra giá, phòng trống và thông tin liên hệ thường xuyên để tránh bỏ lỡ đặt phòng."
            action="Tìm hiểu thêm"
          />
          <Notice
            tone="danger"
            title={isOpen ? "Giá không hoàn tiền vẫn chưa khả dụng" : "Chỗ nghỉ đang chưa mở phòng"}
            description={
              isOpen
                ? "Hiện tại, khách chỉ có thể đặt chỗ nghỉ nếu Quý vị cài đặt giá linh động."
                : "Chỗ nghỉ sẽ nằm trong khu vực quản lý nhưng chưa nhận đặt phòng cho đến khi được duyệt và mở hoạt động."
            }
            action={isOpen ? "Thêm giá linh động ngay" : "Hoàn tất thiết lập"}
          />

          <section>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{name}</h1>
              <span
                className={`rounded-sm px-3 py-1 text-sm font-bold text-white ${
                  isOpen ? "bg-emerald-700" : "bg-[#f60057]"
                }`}
              >
                {isOpen ? "Mở / Có thể đặt phòng" : "Đóng / Không thể đặt phòng"}
              </span>
            </div>
            <p className="mt-2 text-gray-700">
              {detail.address || "Chưa có địa chỉ"} · {city}
            </p>
          </section>

          <section className="border border-gray-300 bg-white p-6">
            <h2 className="text-2xl font-bold">
              Thiết lập cơ bản ({setupDone} / {setupItems.length} đã hoàn tất)
            </h2>
            <div className="mt-6 h-2 rounded bg-gray-200">
              <div
                className="h-2 rounded bg-[#f60057]"
                style={{ width: `${(setupDone / setupItems.length) * 100}%` }}
              />
            </div>
            <div className="mt-5 divide-y divide-gray-200">
              {setupItems.map((item) => (
                <SetupRow key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="border border-gray-300 bg-white p-6">
            <h2 className="text-2xl font-bold">Quản lý trạng thái chỗ nghỉ</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tạm đóng sẽ ẩn chỗ nghỉ khỏi public. Xóa chỗ nghỉ sẽ gửi yêu cầu
              để quản trị viên xử lý, không xóa cứng ngay.
            </p>
            <div className="mt-5">
              <PartnerPropertyActions
                propertyId={detail.id}
                status={propertyStatus}
                isActive={Boolean(detail.is_active)}
              />
            </div>
          </section>

          <section className="border border-gray-300 bg-white p-6">
            <h2 className="text-2xl font-bold">Đặt phòng</h2>
            <div className="mt-5 flex gap-8 border-b border-gray-300">
              {["Khách đến", "Khách đi", "Lượt lưu trú qua đêm", "Yêu cầu của khách"].map(
                (label, index) => (
                  <button
                    key={label}
                    className={`pb-4 ${index === 0 ? "border-b-2 border-[#f60057] text-[#f60057]" : "text-gray-600"}`}
                  >
                    {label} <Badge>0</Badge>
                  </button>
                ),
              )}
            </div>
            <EmptyState text="Quý vị không có khách đến trong khoảng thời gian được chọn" />
            <Link
              href="/host/bookings"
              className="mt-4 inline-flex border border-[#f60057] px-5 py-3 font-bold text-[#f60057]"
            >
              Xem tất cả đặt phòng
            </Link>
          </section>

          <section className="border border-gray-300 bg-white p-6">
            <h2 className="text-2xl font-bold">Các tin nhắn chưa trả lời</h2>
            <div className="mt-5 border border-rose-300 bg-rose-50 p-5 text-[#f60057]">
              <div className="flex gap-4">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-bold">Chưa có tin nhắn cần xử lý.</p>
                  <Link href="/host/messages" className="mt-3 inline-flex font-bold">
                    Xem tất cả các tin nhắn
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="border border-gray-300 bg-white p-6">
            <h2 className="text-2xl font-bold">Điểm chỗ nghỉ</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <Score label="Điểm trang chỗ nghỉ" value="75%" />
              <Score label="Điểm đánh giá của khách" value="10,0" strong />
            </div>
          </section>

          <section className="border border-gray-300 bg-white p-6">
            <h2 className="text-2xl font-bold">Hiệu suất kết quả tìm kiếm</h2>
            <p className="mt-1 text-gray-600">Trong 30 ngày qua</p>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <Metric value="1" label="Lượt xem trên kết quả tìm kiếm" />
              <Metric value="14" label="Lượt xem trang chỗ nghỉ" />
              <Metric value="0" label="Đặt phòng đã nhận" />
            </div>
          </section>
        </div>

        <aside className="border-l border-gray-300 bg-white lg:-my-8 lg:p-6">
          <h2 className="text-2xl font-bold">Đang chờ xử lý</h2>
          <p className="mt-4 text-sm text-gray-600">
            Hoàn tất. Thông báo sẽ hiển thị tại đây khi có nhiệm vụ mới.
          </p>
          <div className="mt-8 divide-y divide-gray-200">
            <Suggestion title="Số đơn đặt tăng thêm đến 36% với Ưu Đãi Mùa Du Lịch" action="Kích hoạt ưu đãi" />
            <Suggestion title="Trang thông tin liên hệ mới giúp cập nhật dễ dàng hơn" action="Cập nhật thông tin liên hệ" />
            <Suggestion title="Thiết lập kế hoạch mở lại chỗ nghỉ" action="Thiết lập ngay" />
            <Suggestion title="Thêm nôi/cũi để tăng đặt phòng từ khách gia đình" action="Thêm ngay" />
            <Suggestion title="Quản lý chỗ nghỉ của Quý vị khi đang di động" action="Tìm hiểu thêm" />
          </div>
        </aside>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  dropdown,
  badge,
  href,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  dropdown?: boolean;
  badge?: number;
  href?: string;
}) {
  const className = `relative flex min-w-fit flex-col items-center gap-1 px-5 py-4 text-sm font-semibold hover:bg-white/10 ${
    active ? "bg-white/10 shadow-[inset_0_-4px_0_#fff]" : ""
  }`;
  const content = (
    <>
      <span className="relative [&>svg]:h-7 [&>svg]:w-7">
        {icon}
        {badge ? (
          <span className="absolute -right-2 -top-2 rounded-full bg-white px-1.5 text-xs font-bold text-[#f60057]">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="flex items-center gap-1">
        {label}
        {dropdown ? <ChevronDown className="h-4 w-4" /> : null}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className}>
      {content}
    </button>
  );
}

function Notice({
  tone,
  title,
  description,
  action,
}: {
  tone: "warning" | "danger";
  title: string;
  description: string;
  action: string;
}) {
  const classes =
    tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : "border-rose-300 bg-rose-50";
  return (
    <div className={`border p-6 ${classes}`}>
      <div className="flex gap-4">
        <AlertCircle className={`mt-1 h-6 w-6 shrink-0 ${tone === "warning" ? "text-amber-600" : "text-[#f60057]"}`} />
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-3">{description}</p>
          <button className="mt-5 font-bold text-[#f60057]">{action}</button>
        </div>
      </div>
    </div>
  );
}

function SetupRow({
  done,
  title,
  action,
  href,
}: {
  done: boolean;
  title: string;
  action: string;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-5">
      {done ? (
        <CheckCircle2 className="h-6 w-6 text-emerald-700" />
      ) : (
        <AlertCircle className="h-6 w-6 text-[#f60057]" />
      )}
      <p className={`flex-1 text-lg font-bold ${done ? "text-emerald-700" : ""}`}>
        {title}
      </p>
      {!done && href ? (
        <Link
          href={href}
          className="border border-[#f60057] px-5 py-2 font-bold text-[#f60057]"
        >
          {action}
        </Link>
      ) : null}
      {!done && !href ? (
        <button className="border border-[#f60057] px-5 py-2 font-bold text-[#f60057]">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="ml-1 rounded-full bg-[#f60057] px-1.5 py-0.5 text-xs font-bold text-white">
      {children}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center text-center text-lg">
      <div className="mb-5 h-14 w-14 rounded-sm border-4 border-gray-400" />
      <p>{text}</p>
    </div>
  );
}

function Score({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p>{label}</p>
        <p className="font-bold">{value}</p>
      </div>
      <div className="mt-2 h-2 bg-gray-200">
        <div className={`h-2 ${strong ? "bg-[#f60057]" : "bg-rose-300"}`} style={{ width: value }} />
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  );
}

function Suggestion({ title, action }: { title: string; action: string }) {
  return (
    <div className="py-6">
      <div className="flex gap-4">
        <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-gray-700" />
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-3 text-sm text-gray-700">
            Đề xuất dựa trên dữ liệu vận hành của chỗ nghỉ và hành vi khách trên StaySaga.
          </p>
          <button className="mt-4 font-bold text-[#f60057]">{action}</button>
        </div>
      </div>
    </div>
  );
}
