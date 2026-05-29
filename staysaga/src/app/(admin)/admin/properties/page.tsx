import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminPropertiesClient } from "./AdminPropertiesClient";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";
import { isPropertyStatus } from "@/core/properties/status";

type AdminPropertiesPageProps = {
  searchParams?: Promise<{
    status?: string;
    propertyStatus?: string;
    error?: string;
    page?: string;
    limit?: string;
    q?: string;
    city?: string;
    owner?: string;
    ownerId?: string;
  }>;
};

function getStatusFilter(value?: string) {
  const status = value || "";
  return isPropertyStatus(status) || status === "ON_SALE" ? status : "";
}

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
  approved: "Đã phê duyệt chỗ nghỉ thành công.",
  rejected: "Đã từ chối chỗ nghỉ thành công.",
};

export default async function AdminPropertiesPage({ searchParams }: AdminPropertiesPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  
  const statusFilter = getStatusFilter(params.propertyStatus || params.status);
  const q = params.q?.trim() || "";
  const cityFilter = params.city || "";
  const ownerFilter = params.owner?.trim() || "";
  const ownerIdFilter = params.ownerId || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const offset = (page - 1) * limit;

  const supabaseAdmin = await createAdminClient();

  // 1. Get distinct cities list from homestays for filter dropdown
  const { data: dbCities } = await supabaseAdmin.from("homestays").select("city");
  const cities = Array.from(
    new Set((dbCities || []).map((h) => h.city).filter(Boolean))
  ).filter((c) => c !== "Việt Nam") as string[];

  // 2. Fetch total count of filtered properties & paginated rows
  let totalCount = 0;
  let propertiesData: any[] = [];
  let dbError: any = null;

  try {
    let query = supabaseAdmin
      .from("homestays")
      .select(
        `
          id,
          owner_id,
          name,
          city,
          address,
          description,
          price_per_night,
          max_guests,
          bedrooms,
          beds,
          bathrooms,
          is_active,
          status,
          delete_reason,
          rejection_reason,
          created_at,
          owner:profiles!homestays_owner_id_fkey(full_name, email),
          homestay_images(url),
          homestay_amenities(
            amenities(name)
          ),
          rooms(name, max_guests, price_per_night)
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply Filters
    if (ownerIdFilter) {
      query = query.eq("owner_id", ownerIdFilter);
    }

    if (statusFilter === "PENDING") {
      query = query.eq("status", "PENDING");
    } else if (statusFilter === "APPROVED") {
      query = query.eq("status", "APPROVED").eq("is_active", false);
    } else if (statusFilter === "ON_SALE") {
      query = query.eq("status", "APPROVED").eq("is_active", true);
    } else if (statusFilter === "REJECTED") {
      query = query.eq("status", "REJECTED");
    } else if (statusFilter === "CLOSED_TEMP") {
      query = query.eq("status", "CLOSED_TEMP");
    } else if (statusFilter === "SUSPENDED") {
      query = query.eq("status", "SUSPENDED");
    } else if (statusFilter === "DELETE_REQUESTED") {
      query = query.eq("status", "DELETE_REQUESTED");
    } else if (statusFilter === "DELETED") {
      query = query.eq("status", "DELETED");
    }

    if (cityFilter) {
      query = query.eq("city", cityFilter);
    }

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    if (ownerFilter) {
      const { data: resUsers } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`full_name.ilike.%${ownerFilter}%,email.ilike.%${ownerFilter}%`);
      const matchedOwnerIds = resUsers?.map((u) => u.id) || [];
      if (matchedOwnerIds.length > 0) {
        query = query.in("owner_id", matchedOwnerIds);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // force 0
      }
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    dbError = error;
    if (data) {
      propertiesData = data;
      totalCount = count || 0;
    }
  } catch (err) {
    dbError = err;
  }

  if (dbError) {
    console.error("Lỗi lấy danh sách chỗ nghỉ admin:", {
      message: dbError.message,
      code: dbError.code,
      details: dbError.details,
      hint: dbError.hint,
      stack: dbError.stack,
      raw: dbError
    });
  }

  // Parse list rows into unified client structure
  const properties = propertiesData.map((row) => {
    const ownerData = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    return {
      ...row,
      owner: ownerData || null,
    };
  });

  // 3. Query exact lightweight counts for each status tab
  const getTabCount = async (statusVal?: string, isActive?: boolean) => {
    try {
      let qCount = supabaseAdmin.from("homestays").select("id", { count: "exact", head: true });
      if (statusVal) {
        qCount = qCount.eq("status", statusVal);
      }
      if (isActive !== undefined) {
        qCount = qCount.eq("is_active", isActive);
      }
      if (ownerIdFilter) {
        qCount = qCount.eq("owner_id", ownerIdFilter);
      }
      const { count, error } = await qCount;
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const [
    countAll,
    countPending,
    countApproved,
    countOnSale,
    countRejected,
    countClosedTemp,
    countSuspended,
    countDeleteRequested,
    countDeleted,
  ] = await Promise.all([
    getTabCount(),
    getTabCount("PENDING"),
    getTabCount("APPROVED", false),
    getTabCount("APPROVED", true),
    getTabCount("REJECTED"),
    getTabCount("CLOSED_TEMP"),
    getTabCount("SUSPENDED"),
    getTabCount("DELETE_REQUESTED"),
    getTabCount("DELETED"),
  ]);

  const tabCounts = {
    all: countAll,
    pending: countPending,
    approved: countApproved,
    onSale: countOnSale,
    rejected: countRejected,
    closedTemp: countClosedTemp,
    suspended: countSuspended,
    deleteRequested: countDeleteRequested,
    deleted: countDeleted,
  };

  return (
    <AdminShell
      title="Quản lý chỗ nghỉ"
      description="Duyệt yêu cầu đăng tin mới, tạm đóng, ẩn, mở lại hoặc khóa chỗ nghỉ của các đối tác."
      activePath="/admin/properties"
    >
      {successMessages[params.status || ""] && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 shadow-sm">
          {successMessages[params.status || ""]}
        </div>
      )}
      {params.error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800 shadow-sm">
          {errorMessages[params.error] || "Không xử lý được thao tác."}
        </div>
      )}

      {/* Render the interactive Client Table & details drawer */}
      <AdminPropertiesClient
        initialProperties={properties}
        totalItems={totalCount}
        itemsPerPage={limit}
        tabCounts={tabCounts}
        cities={cities}
      />
      
      {/* Supabase Realtime Subscription */}
      <RealtimeSubscription table="homestays" />
    </AdminShell>
  );
}
