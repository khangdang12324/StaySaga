import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download,
  Eye,
  ListChecks,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  Settings2,
  Star,
  ThumbsUp,
  ThumbsDown,
  XCircle,
} from "lucide-react";
import { HostExtranetShell } from "./_components/HostExtranetShell";
import { ListingActionsDropdown } from "./_components/ListingActionsDropdown";
import { DeleteRegistrationButton } from "./_components/DeleteRegistrationButton";
import { getHostDashboardData } from "@/core/host/actions";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";

type DashboardListing = Awaited<
  ReturnType<typeof getHostDashboardData>
>["listings"][number];

const placeholderNames = new Set([
  "ChÃ¡Â»â€” nghÃ¡Â»â€° chÃ†Â°a Ã„â€˜Ã¡ÂºÂ·t tÃƒÂªn",
  "Cho nghi chua dat ten",
  "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn",
  "Chỗ nghỉ chưa đặt tên",
]);

const hasPositiveNumber = (value: unknown) => Number(value || 0) > 0;

const getListingDisplayName = (item: DashboardListing) => {
  const name = item.name?.trim();
  if (name && !placeholderNames.has(name)) {
    return name;
  }
  const draftName = item.registration_checklist?.draftState?.name;
  if (draftName && typeof draftName === "string" && draftName.trim()) {
    return draftName.trim();
  }
  return "Chỗ nghỉ chưa đặt tên";
};

const hasRealName = (item: DashboardListing) => {
  const name = getListingDisplayName(item);
  return Boolean(name && !placeholderNames.has(name));
};

const getRegistrationProgress = (item: DashboardListing) => {
  if (item.status === "APPROVED" && item.is_active) return 100;

  const checklist = item.registration_checklist;
  const completedSteps = checklist?.completedSteps || {};
  const hasImages = (item.homestay_images?.length ?? 0) > 0;
  const hasPrice = hasPositiveNumber(item.price_per_night);

  const stepsState = {
    propertyType: completedSteps.propertyType === true || Boolean(item.property_type),
    basicInfo: completedSteps.basicInfo === true || hasRealName(item),
    address: completedSteps.address === true || Boolean(item.address && item.city),
    photos: completedSteps.photos === true || hasImages,
    rooms: completedSteps.rooms === true || (hasPositiveNumber(item.bedrooms) && hasPositiveNumber(item.beds)),
    price: completedSteps.price === true || hasPrice,
    amenities: completedSteps.amenities === true || checklist?.amenities === true,
    policies: completedSteps.policies === true || checklist?.policies === true,
    verification: completedSteps.verification === true || Boolean(item.owner_name && item.contact_phone),
    review: completedSteps.review === true,
  };

  const totalRequiredSteps = 10;
  const completedCount = Object.values(stepsState).filter(Boolean).length;
  let progress = Math.floor((completedCount / totalRequiredSteps) * 100);

  if (item.status === "PENDING") {
    progress = Math.max(progress, 90);
  }

  return Math.min(99, Math.max(5, progress));
};

const WIZARD_STEPS = [
  "category", "units", "confirm", "name", "address", "channel",
  "details", "bedroom", "amenities", "services", "languages", "policies",
  "partner-profile", "photos", "booking", "price", "availability", "rates",
  "non-refundable", "group-pricing", "legal", "review",
];

const getRegistrationStep = (item: DashboardListing) => {
  const checklist = item.registration_checklist;
  const savedStep = typeof checklist?.currentStep === "number" ? checklist.currentStep : -1;

  // Always trust savedStep if the wizard stored a valid step index (>0 avoids step 0 = category)
  if (savedStep > 0 && savedStep < WIZARD_STEPS.length) {
    return WIZARD_STEPS[savedStep];
  }

  // Fallback: derive from data fields when no checklist saved
  const hasImages = (item.homestay_images?.length ?? 0) > 0;
  if (!hasRealName(item)) return "name";
  if (!item.address?.trim() || !item.city?.trim() || !item.country?.trim()) return "address";
  if (!hasPositiveNumber(item.max_guests) || !hasPositiveNumber(item.bathrooms)) return "details";
  if (!hasPositiveNumber(item.bedrooms) || !hasPositiveNumber(item.beds)) return "bedroom";
  if (!hasImages) return "photos";
  if (!hasPositiveNumber(item.price_per_night)) return "price";
  return "review";
};

const getContinueRegistrationHref = (item: DashboardListing) => {
  const checklist = item.registration_checklist;
  const savedStep = typeof checklist?.currentStep === "number" ? checklist.currentStep : -1;
  // If the wizard saved a step >= 0, let the wizard auto-restore from draftState.currentStep
  // (don't pass ?step= so URL param doesn't override the saved step)
  if (savedStep >= 0 && savedStep < WIZARD_STEPS.length) {
    return `/host/register?propertyId=${item.id}`;
  }
  // No saved step: hint the wizard with a derived editStep
  return `/host/register?propertyId=${item.id}&editStep=${getRegistrationStep(item)}`;
};

type HostPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

const successMessages: Record<string, string> = {
  created: "Đã gửi chỗ nghỉ để chờ duyệt.",
  updated: "Đã cập nhật chỗ nghỉ.",
  closed: "Đã tạm đóng chỗ nghỉ.",
  opened: "Đã mở lại chỗ nghỉ.",
  delete_requested: "Đã gửi yêu cầu xóa chỗ nghỉ đến quản trị viên.",
  registration_deleted: "Đã xóa đăng ký chỗ nghỉ.",
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
  const {
    listings,
    pendingBookings,
    todayCheckIns = 0,
    todayCheckOuts = 0,
    reviewsCount = 0,
    cancelledCount = 0,
  } = await getHostDashboardData();
  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";
  const activeListings = listings.filter(
    (item) =>
      item.status !== "DRAFT" &&
      item.status !== "DELETED",
  );
  const notOnBookingListings = listings.filter(
    (item) =>
      item.status === "DRAFT",
  );
  const visibleListings = activeListings;
  const visibleInactiveListings = notOnBookingListings;

  const getStatusBadge = (status?: string, isActive?: boolean) => {
    const currentStatus = status || "PENDING";
    const baseClass = "inline-flex items-center gap-1.5 text-xs font-semibold";
    
    if (currentStatus === "APPROVED") {
      if (isActive) {
        return (
          <span className={`${baseClass} text-emerald-800`}>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Mở / Có thể đặt phòng
          </span>
        );
      } else {
        return (
          <span className={`${baseClass} text-slate-600`}>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Đã duyệt
          </span>
        );
      }
    }

    const statusConfigs: Record<string, { label: string; dotClass: string; textClass: string }> = {
      DRAFT: { label: "Bản nháp", dotClass: "bg-slate-400", textClass: "text-slate-600" },
      PENDING: { label: "Chờ duyệt", dotClass: "bg-amber-400", textClass: "text-amber-800" },
      REJECTED: { label: "Bị từ chối", dotClass: "bg-rose-500", textClass: "text-rose-700" },
      CLOSED_TEMP: { label: "Tạm đóng", dotClass: "bg-orange-400", textClass: "text-orange-800" },
      DELETE_REQUESTED: { label: "Chờ xóa", dotClass: "bg-red-400 animate-pulse", textClass: "text-red-700 font-bold" },
      DELETED: { label: "Đã xóa", dotClass: "bg-slate-300", textClass: "text-slate-400 italic" },
      SUSPENDED: { label: "Bị khóa", dotClass: "bg-red-600", textClass: "text-red-700" },
    };

    const config = statusConfigs[currentStatus] || { label: currentStatus, dotClass: "bg-slate-400", textClass: "text-slate-600" };

    return (
      <span className={`${baseClass} ${config.textClass}`}>
        <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
    );
  };

  return (
    <HostExtranetShell active="home" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-8">
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
            <Link href="/host/list" className="font-medium text-gray-700">
              Ẩn mục
            </Link>
          </div>
          <p className="mt-7">
            Phát triển kinh doanh bằng cách thêm các chỗ nghỉ này vào nền tảng
            du lịch trực tuyến lớn nhất thế giới, StaySaga.
          </p>
          <div className="mt-6 overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-5 py-4">Chỗ nghỉ</th>
                  <th className="px-5 py-4">Quốc gia</th>
                  <th className="px-5 py-4">Tiến độ hoàn thiện</th>
                  <th className="px-5 py-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visibleInactiveListings.map((listing) => {
                  const progress = getRegistrationProgress(listing);
                  const continueHref = getContinueRegistrationHref(listing);
                  return (
                    <tr key={listing.id} className="border-b border-gray-300">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden bg-gray-200">
                            {listing.homestay_images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={listing.homestay_images[0].url}
                                alt={getListingDisplayName(listing)}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <Link
                              href={continueHref}
                              className="font-bold text-[#f60057] hover:underline"
                            >
                              {getListingDisplayName(listing)}
                            </Link>
                            <p className="text-sm text-gray-500">
                              {listing.address || listing.city || "Việt Nam"}
                            </p>
                            {listing.registration_checklist?.completedSteps?.photos === true && (listing.homestay_images?.length ?? 0) === 0 && (
                              <p className="mt-1 text-xs font-semibold text-amber-600 flex items-center gap-1">
                                ⚠️ Bước ảnh đã hoàn thành nhưng chưa tìm thấy ảnh đã upload. Vui lòng kiểm tra lại.
                              </p>
                            )}
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
                            href={continueHref}
                            className="font-medium text-[#f60057] underline"
                          >
                            Tiếp tục đăng ký
                          </Link>
                          <DeleteRegistrationButton propertyId={listing.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleInactiveListings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center">
                      <p className="font-bold">
                        Không có chỗ nghỉ nào chưa có trên StaySaga.
                      </p>
                      <Link
                        href="/host/register?new=1"
                        className="mt-4 inline-flex rounded-sm bg-[#f60057] px-5 py-3 font-bold text-white"
                      >
                        {listings.length > 0 ? "Tạo chỗ nghỉ mới" : "Tạo chỗ nghỉ đầu tiên"}
                      </Link>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">Các chỗ nghỉ trên StaySaga</h2>
          <div className="mt-8 flex flex-wrap items-end gap-5">
            <label className="font-bold">
              Lọc theo vị trí
              <select className="mt-2 block h-11 w-[250px] border border-gray-500 bg-white px-3 font-normal">
                <option>{activeListings.length} chỗ nghỉ trên StaySaga</option>
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
                  className={`pb-4 text-sm font-semibold transition-colors ${
                    index === 0
                      ? "border-b-2 border-[#006ce4] text-[#006ce4]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <h3 className="mt-7 text-2xl font-bold">Tổng quan hôm nay</h3>
          <div className="mt-7 grid border border-gray-300 bg-white md:grid-cols-5">
            <OverviewMetric icon={<ListChecks className="h-7 w-7" />} value={pendingBookings} label="Đặt phòng" />
            <OverviewMetric icon={<LogIn className="h-7 w-7" />} value={todayCheckIns} label="Khách đến" />
            <OverviewMetric icon={<LogOut className="h-7 w-7" />} value={todayCheckOuts} label="Khách đi" />
            <OverviewMetric
              icon={
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-400">
                  <Star className="h-4.5 w-4.5" />
                </div>
              }
              value={reviewsCount}
              label="Đánh giá"
            />
            <OverviewMetric icon={<XCircle className="h-7 w-7" />} value={cancelledCount} label="Lượt hủy" />
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

          <div className="mt-8 overflow-x-auto border border-gray-300 bg-white">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-gray-300 text-gray-700">
                  <th className="px-4 py-4 font-bold">ID ↑</th>
                  <th className="px-4 py-4 font-bold">Chỗ nghỉ</th>
                  <th className="px-4 py-4 font-bold">Trạng thái trên StaySaga</th>
                  <th className="px-4 py-4 font-bold text-center">Đến trong 48 giờ tới</th>
                  <th className="px-4 py-4 font-bold text-center">Rời đi trong 48 giờ tới</th>
                  <th className="px-4 py-4 font-bold text-center">Tin nhắn từ khách</th>
                  <th className="px-4 py-4 font-bold text-center">Tin nhắn từ StaySaga</th>
                  <th className="px-4 py-4 font-bold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {visibleListings.map((listing) => {
                  const renderValueBadge = (val?: number) => {
                    const num = val || 0;
                    if (num > 0) {
                      return (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#006ce4] text-xs font-bold text-white">
                          {num}
                        </span>
                      );
                    }
                    return <span className="text-gray-400">0</span>;
                  };

                  return (
                    <tr key={listing.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="px-4 py-5 text-gray-600">{listing.id.slice(0, 8)}</td>
                      <td className="px-4 py-5">
                        <Link
                          href={`/host/${listing.id}`}
                          className="font-bold text-gray-900 hover:text-[#006ce4] hover:underline"
                        >
                          {getListingDisplayName(listing)}
                        </Link>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e61212] text-white">
                            <Star className="h-2.5 w-2.5 fill-white stroke-none" />
                          </span>
                          <span className="text-xs text-gray-500">
                            {listing.address || listing.city || "Việt Nam"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-5 align-middle">
                        {getStatusBadge(listing.status, listing.is_active)}
                      </td>
                      <td className="px-4 py-5 text-center align-middle">
                        {renderValueBadge(listing.check_ins_48h)}
                      </td>
                      <td className="px-4 py-5 text-center align-middle">
                        {renderValueBadge(listing.check_outs_48h)}
                      </td>
                      <td className="px-4 py-5 text-center align-middle">
                        {renderValueBadge(listing.guest_messages_count)}
                      </td>
                      <td className="px-4 py-5 text-center align-middle">
                        {renderValueBadge(listing.system_messages_count)}
                      </td>
                      <td className="px-4 py-5 text-right align-middle">
                        <ListingActionsDropdown
                          propertyId={listing.id}
                          status={listing.status || "APPROVED"}
                          isActive={listing.is_active}
                        />
                      </td>
                    </tr>
                  );
                })}
                {visibleListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-600">
                      Chưa có chỗ nghỉ nào đang hoạt động.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-[#a2c8f9] bg-[#ebf3ff] px-6 py-4 text-sm text-gray-800">
            <span>
              Phản hồi của Quý vị rất quan trọng với chúng tôi. Quý vị thấy dữ liệu này có hữu ích không?
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
                title="Hữu ích"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
                title="Góp ý"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
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
      <RealtimeSubscription table="homestays" filter={`owner_id=eq.${session.user.id}`} />
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
      <div className="text-gray-700 flex items-center h-8">{icon}</div>
      <p className="mt-7 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-4 text-lg text-[#006ce4]">{label}</p>
    </div>
  );
}
