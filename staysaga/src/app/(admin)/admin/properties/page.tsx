import SafeImage from "@/components/ui/SafeImage";
import { PROPERTY_STATUS_LABELS, isPropertyStatus, type PropertyStatus } from "@/core/properties/status";
import { getLocationImage } from "@/lib/images/location-images";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { AdminPropertyActions } from "./AdminPropertyActions";

type AdminPropertiesPageProps = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    owner?: string;
    propertyStatus?: string;
    status?: string;
    error?: string;
  }>;
};

type AdminPropertyRow = {
  id: string;
  name: string | null;
  city: string | null;
  price_per_night: number | string | null;
  is_active: boolean | null;
  status: string | null;
  delete_reason: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  owner?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  homestay_images?: { url: string | null }[] | null;
};

const errorMessages: Record<string, string> = {
  invalid: "Dữ liệu thao tác không hợp lệ.",
  update_failed: "Chưa cập nhật được trạng thái chỗ nghỉ.",
  active_bookings: "Không thể xóa chỗ nghỉ vì vẫn còn đơn đặt phòng đang hoạt động.",
};

const successMessages: Record<string, string> = {
  updated: "Đã cập nhật trạng thái chỗ nghỉ.",
  deleted: "Đã duyệt xóa mềm chỗ nghỉ.",
  delete_rejected: "Đã từ chối yêu cầu xóa chỗ nghỉ.",
  suspended: "Đã khóa chỗ nghỉ.",
};

function getStatus(value?: string | null): PropertyStatus {
  const rawStatus = value || "";
  return isPropertyStatus(rawStatus) ? rawStatus : "APPROVED";
}

function getOwner(row: AdminPropertyRow) {
  const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
  return owner?.full_name || owner?.email || "Chưa có chủ sở hữu";
}

function getImage(row: AdminPropertyRow) {
  return row.homestay_images?.[0]?.url || getLocationImage(row.city || "Việt Nam");
}

function getBadgeClass(status: PropertyStatus) {
  const classes: Record<PropertyStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-[#f60057]",
    HIDDEN: "bg-slate-100 text-slate-700",
    SUSPENDED: "bg-rose-100 text-[#f60057]",
    CLOSED_TEMP: "bg-amber-100 text-amber-800",
    DELETE_REQUESTED: "bg-amber-100 text-amber-800",
    DELETED: "bg-slate-200 text-slate-600",
  };
  return classes[status];
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default async function AdminPropertiesPage({ searchParams }: AdminPropertiesPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const supabaseAdmin = await createAdminClient();

  const q = params.q?.trim() || "";
  const city = params.city?.trim() || "";
  const owner = params.owner?.trim() || "";
  const propertyStatus = params.propertyStatus?.trim() || "";

  let query = supabaseAdmin
    .from("homestays")
    .select(
      "id, name, city, price_per_night, is_active, status, delete_reason, rejection_reason, created_at, owner:profiles!homestays_owner_id_fkey(full_name, email), homestay_images(url)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.eq("city", city);
  if (propertyStatus && isPropertyStatus(propertyStatus)) query = query.eq("status", propertyStatus);

  const { data } = await query;
  const properties = ((data || []) as AdminPropertyRow[]).filter((row) => {
    if (!owner) return true;
    return getOwner(row).toLowerCase().includes(owner.toLowerCase());
  });

  const propertyIds = properties.map((property) => property.id);
  const activeBookingCounts = new Map<string, number>();
  if (propertyIds.length > 0) {
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("homestay_id, status")
      .in("homestay_id", propertyIds)
      .in("status", ["PENDING", "CONFIRMED", "CHECKED_IN", "STAYING"]);

    for (const booking of bookings || []) {
      const id = String(booking.homestay_id || "");
      activeBookingCounts.set(id, (activeBookingCounts.get(id) || 0) + 1);
    }
  }

  const cities = Array.from(new Set(properties.map((property) => property.city).filter(Boolean))) as string[];

  return (
    <AdminShell
      title="Quản lý chỗ nghỉ"
      description="Quản trị viên duyệt, ẩn, khóa, tạm đóng, mở lại hoặc xử lý yêu cầu xóa mềm chỗ nghỉ."
      activePath="/admin/properties"
    >
      {successMessages[params.status || ""] && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          {successMessages[params.status || ""]}
        </div>
      )}
      {params.error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-[#f60057]">
          {errorMessages[params.error] || "Không xử lý được thao tác."}
        </div>
      )}

      <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Tìm tên chỗ nghỉ</span>
          <input
            name="q"
            defaultValue={q}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-rose-500 text-slate-950 bg-white"
            placeholder="Nhập tên chỗ nghỉ"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Thành phố</span>
          <select name="city" defaultValue={city} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-rose-500 text-slate-950 bg-white">
            <option value="">Tất cả thành phố</option>
            {cities.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Trạng thái</span>
          <select name="propertyStatus" defaultValue={propertyStatus} className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-rose-500 text-slate-950 bg-white">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Chủ sở hữu</span>
          <input
            name="owner"
            defaultValue={owner}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-rose-500 text-slate-950 bg-white"
            placeholder="Tên hoặc email"
          />
        </label>
        <div className="md:col-span-4">
          <button className="rounded-lg bg-[#f60057] px-5 py-2.5 font-bold text-white hover:bg-[#d9004e]">
            Lọc dữ liệu
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-4 font-bold">Ảnh</th>
                <th className="px-4 py-4 font-bold">Tên chỗ nghỉ</th>
                <th className="px-4 py-4 font-bold">Chủ sở hữu</th>
                <th className="px-4 py-4 font-bold">Thành phố</th>
                <th className="px-4 py-4 font-bold">Giá mỗi đêm</th>
                <th className="px-4 py-4 font-bold">Trạng thái</th>
                <th className="px-4 py-4 font-bold">Booking đang hoạt động</th>
                <th className="px-4 py-4 font-bold">Ngày tạo</th>
                <th className="px-4 py-4 text-right font-bold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((property) => {
                const status = getStatus(property.status);
                return (
                  <tr key={property.id} className="align-top transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <SafeImage
                        src={getImage(property)}
                        alt={property.name || "Chỗ nghỉ"}
                        width={72}
                        height={52}
                        className="h-14 w-20 rounded object-cover"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-950">{property.name || "Chỗ nghỉ chưa đặt tên"}</p>
                      <p className="mt-1 text-xs text-slate-500">ID {String(property.id).slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">{getOwner(property)}</td>
                    <td className="px-4 py-4 text-slate-700">{property.city || "-"}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">
                      {Number(property.price_per_night || 0).toLocaleString("vi-VN")} VND
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded px-2.5 py-1 text-xs font-bold ${getBadgeClass(status)}`}>
                        {PROPERTY_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold">{activeBookingCounts.get(property.id) || 0}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(property.created_at)}</td>
                    <td className="px-4 py-4">
                      <AdminPropertyActions
                        propertyId={property.id}
                        status={status}
                        deleteReason={property.delete_reason}
                        rejectionReason={property.rejection_reason}
                      />
                    </td>
                  </tr>
                );
              })}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center font-semibold text-slate-600">
                    Chưa có chỗ nghỉ nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
