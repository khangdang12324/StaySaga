import { Search } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";
import { ServerPagination } from "@/components/ui/ServerPagination";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { AdminPartnerActions } from "./AdminPartnerActions";

type AdminPartnersPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  avatar_url: string | null;
};

type HomestayRow = {
  id: string;
  owner_id: string | null;
  status: string | null;
};

type BookingRow = {
  id: string;
  homestay_id: string | null;
  total_price: number | string | null;
  status: string | null;
};

type PartnerType = "PARTNER" | "ADMIN_PARTNER";

const PENDING_HOMESTAY_STATUSES = new Set(["PENDING", "PENDING_APPROVAL", "SUBMITTED", "UNDER_REVIEW"]);
const REVENUE_BOOKING_STATUSES = new Set(["CONFIRMED", "COMPLETED", "PAID"]);

function normalizeStatus(status: string | null) {
  return status || "ACTIVE";
}

function getPartnerType(profile: ProfileRow, homestaysCount: number): PartnerType {
  if (profile.role === "ADMIN" && homestaysCount > 0) return "ADMIN_PARTNER";
  return "PARTNER";
}

function getPartnerBadge(type: PartnerType) {
  return type === "ADMIN_PARTNER" ? "Quản trị viên kiêm đối tác" : "Đối tác";
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminPartnersPage({ searchParams }: AdminPartnersPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};

  const q = params.q?.trim() || "";
  const statusFilter = params.status?.trim() || "";
  const typeFilter = params.type?.trim() || "";
  const page = Number(params.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const supabaseAdmin = await createAdminClient();

  const [resProfiles, { data: dbHomestays, error: homestaysError }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, status, created_at, avatar_url")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("homestays").select("id, owner_id, status"),
  ]);

  let dbProfiles: unknown[] | null = resProfiles.data;
  let profilesError: unknown = resProfiles.error;

  if (
    profilesError &&
    typeof profilesError === "object" &&
    profilesError !== null &&
    ((profilesError as { code?: string }).code === "42703" ||
      String((profilesError as { message?: string }).message || "").includes("status"))
  ) {
    console.warn("Database profiles table is missing 'status' column in partners. Falling back to ACTIVE status.");
    const resFallback = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, created_at, avatar_url")
      .order("created_at", { ascending: false });

    dbProfiles = resFallback.data?.map((profile) => ({ ...profile, status: "ACTIVE" })) || null;
    profilesError = resFallback.error;
  }

  if (profilesError) console.error("Lỗi lấy profiles cho trang đối tác:", profilesError);
  if (homestaysError) console.error("Lỗi lấy homestays cho trang đối tác:", homestaysError);

  const rawProfiles = (dbProfiles || []) as ProfileRow[];
  const homestays = (dbHomestays || []) as HomestayRow[];

  const homestaysByOwner = new Map<string, HomestayRow[]>();
  for (const homestay of homestays) {
    if (!homestay.owner_id) continue;
    const current = homestaysByOwner.get(homestay.owner_id) || [];
    current.push(homestay);
    homestaysByOwner.set(homestay.owner_id, current);
  }

  const partnerProfiles = rawProfiles.filter((profile) => profile.role === "PARTNER" || homestaysByOwner.has(profile.id));
  const partnerIds = new Set(partnerProfiles.map((profile) => profile.id));
  const partnerHomestayIds = homestays
    .filter((homestay) => homestay.owner_id && partnerIds.has(homestay.owner_id))
    .map((homestay) => homestay.id);

  let bookings: BookingRow[] = [];
  if (partnerHomestayIds.length > 0) {
    const { data: dbBookings, error: bookingsError } = await supabaseAdmin
      .from("bookings")
      .select("id, homestay_id, total_price, status")
      .in("homestay_id", partnerHomestayIds);

    if (bookingsError) console.error("Lỗi lấy bookings cho trang đối tác:", bookingsError);
    bookings = (dbBookings || []) as BookingRow[];
  }

  const bookingsByHomestay = new Map<string, BookingRow[]>();
  for (const booking of bookings) {
    if (!booking.homestay_id) continue;
    const current = bookingsByHomestay.get(booking.homestay_id) || [];
    current.push(booking);
    bookingsByHomestay.set(booking.homestay_id, current);
  }

  const partnersWithStats = partnerProfiles
    .map((partner) => {
      const partnerHomestays = homestaysByOwner.get(partner.id) || [];
      const homestaysCount = partnerHomestays.length;
      const pendingHomestaysCount = partnerHomestays.filter((homestay) =>
        PENDING_HOMESTAY_STATUSES.has(homestay.status || "")
      ).length;
      const partnerBookings = partnerHomestays.flatMap((homestay) => bookingsByHomestay.get(homestay.id) || []);
      const bookingsCount = partnerBookings.length;
      const revenue = partnerBookings
        .filter((booking) => REVENUE_BOOKING_STATUSES.has(booking.status || ""))
        .reduce((sum, booking) => sum + (Number(booking.total_price) || 0), 0);
      const partnerType = getPartnerType(partner, homestaysCount);

      return {
        ...partner,
        status: normalizeStatus(partner.status),
        partnerType,
        partnerBadge: getPartnerBadge(partnerType),
        homestaysCount,
        pendingHomestaysCount,
        bookingsCount,
        revenue,
      };
    })
    .filter((partner) => {
      if (q) {
        const qLower = q.toLowerCase();
        const name = (partner.full_name || "").toLowerCase();
        const email = (partner.email || "").toLowerCase();
        if (!name.includes(qLower) && !email.includes(qLower)) return false;
      }

      if (statusFilter && partner.status !== statusFilter) return false;
      if (typeFilter && partner.partnerType !== typeFilter) return false;
      return true;
    });

  const totalCount = partnersWithStats.length;
  const paginatedPartners = partnersWithStats.slice(offset, offset + limit);

  return (
    <AdminShell
      title="Danh sách đối tác"
      description="Quản lý các tài khoản đối tác và quản trị viên đang sở hữu chỗ nghỉ trên StaySaga."
      activePath="/admin/partners"
    >
      <form className="mb-6 grid items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">Tìm tên/email</span>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-bold text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-rose-500"
              placeholder="Nhập tên hoặc email..."
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">Trạng thái</span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none transition-colors focus:border-rose-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">Loại</span>
          <select
            name="type"
            defaultValue={typeFilter}
            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none transition-colors focus:border-rose-500"
          >
            <option value="">Tất cả loại</option>
            <option value="PARTNER">Đối tác</option>
            <option value="ADMIN_PARTNER">Quản trị viên kiêm đối tác</option>
          </select>
        </label>

        <div className="flex justify-end">
          <button className="rounded-lg bg-rose-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-rose-950/10 transition-colors hover:bg-rose-700">
            Lọc dữ liệu
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Tên đối tác</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">Vai trò hiện tại</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Số chỗ nghỉ quản lý</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Số chỗ nghỉ chờ duyệt</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Số booking</th>
                <th className="px-6 py-4 whitespace-nowrap">Tổng doanh thu</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái tài khoản</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Hành động quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPartners.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm font-bold text-slate-500">
                    Chưa có đối tác nào. Hãy cấp quyền Đối tác cho người dùng hoặc tạo chỗ nghỉ mới.
                  </td>
                </tr>
              ) : (
                paginatedPartners.map((item) => (
                  <tr key={item.id} className="align-middle transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar src={item.avatar_url} alt={item.full_name || "Avatar"} className="h-9 w-9" />
                        <div>
                          <p className="text-sm font-bold leading-snug text-slate-900 whitespace-nowrap">
                            {item.full_name || "Chưa cập nhật tên"}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">ID: {item.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">{item.email || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-slate-900 whitespace-nowrap">{item.role || "USER"}</span>
                        <span
                          className={
                            item.partnerType === "ADMIN_PARTNER"
                              ? "w-fit whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-700"
                              : "w-fit whitespace-nowrap rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-700"
                          }
                        >
                          {item.partnerBadge}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-slate-900 whitespace-nowrap">{item.homestaysCount}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={
                          item.pendingHomestaysCount > 0
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800 whitespace-nowrap"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-500 whitespace-nowrap"
                        }
                      >
                        {item.pendingHomestaysCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-slate-800 whitespace-nowrap">{item.bookingsCount}</td>
                    <td className={`px-6 py-4 text-xs font-black whitespace-nowrap ${item.revenue > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {formatVND(item.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={
                          item.status === "BLOCKED"
                            ? "rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-[10px] font-black text-red-800 whitespace-nowrap"
                            : "rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 whitespace-nowrap"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminPartnerActions
                        partnerId={item.id}
                        partnerName={item.full_name || item.email || "Đối tác"}
                        status={item.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ServerPagination totalItems={totalCount} itemsPerPage={limit} />
        <RealtimeSubscription table="profiles" />
      </div>
    </AdminShell>
  );
}
