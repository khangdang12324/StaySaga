import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminBookingsClient } from "./AdminBookingsClient";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    q?: string;
    paymentStatus?: string;
    checkInDate?: string;
    createdDate?: string;
    city?: string;
    ownerId?: string;
    error?: string;
  }>;
};

type BookingRow = {
  id: string;
  booking_code: string | null;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_price: number | string | null;
  status: string | null;
  payment_status: string | null;
  cancel_reason: string | null;
  special_requests: string | null;
  created_at: string;
  guest: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
  homestay: {
    id: string;
    name: string | null;
    city: string | null;
    owner_id: string | null;
    owner: { id: string; full_name: string | null; email: string | null; phone: string | null } | null;
  } | null;
};

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const offset = (page - 1) * limit;

  const statusFilter = params.status || "";
  const q = params.q?.trim() || "";
  const paymentStatusFilter = params.paymentStatus || "";
  const checkInDate = params.checkInDate || "";
  const createdDate = params.createdDate || "";
  const cityFilter = params.city || "";
  const ownerIdFilter = params.ownerId || "";

  const supabaseAdmin = await createAdminClient();

  // 1. Get distinct cities list from homestays for filter dropdown
  const { data: dbCities } = await supabaseAdmin.from("homestays").select("city");
  const cities = Array.from(new Set((dbCities || []).map((h) => h.city).filter(Boolean))) as string[];

  // 2. Fetch total count of filtered bookings & paginated rows
  let totalCount = 0;
  let bookingsData: any[] | null = null;
  let dbError: any = null;

  // Resolve search filters
  let matchedUserIds: string[] = [];
  let matchedHomestayIds: string[] = [];

  if (q) {
    const [resUsers, resHomestays] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`),
      supabaseAdmin.from("homestays").select("id").ilike("name", `%${q}%`),
    ]);
    matchedUserIds = resUsers.data?.map((u) => u.id) || [];
    matchedHomestayIds = resHomestays.data?.map((h) => h.id) || [];
  }

  // Pre-filter homestays by city if set
  let cityHomestayIds: string[] | null = null;
  if (cityFilter) {
    const { data: resCityHomestays } = await supabaseAdmin
      .from("homestays")
      .select("id")
      .eq("city", cityFilter);
    cityHomestayIds = resCityHomestays?.map((h) => h.id) || [];
  }

  // Pre-filter homestays by owner if set
  let ownerHomestayIds: string[] | null = null;
  if (ownerIdFilter) {
    const { data: resOwnerHomestays } = await supabaseAdmin
      .from("homestays")
      .select("id")
      .eq("owner_id", ownerIdFilter);
    ownerHomestayIds = resOwnerHomestays?.map((h) => h.id) || [];
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const maxIncomingStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    let query = supabaseAdmin
      .from("bookings")
      .select(
        `
          id,
          booking_code,
          check_in_date,
          check_out_date,
          guests,
          total_price,
          status,
          payment_status,
          cancel_reason,
          special_requests,
          created_at,
          guest:profiles!bookings_user_id_fkey(id, full_name, email),
          homestay:homestays!bookings_homestay_id_fkey(
            id,
            name,
            city,
            owner_id,
            owner:profiles!homestays_owner_id_fkey(id, full_name, email)
          )
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply Status / Tab filter
    if (statusFilter === "INCOMING") {
      query = query
        .eq("status", "CONFIRMED")
        .gte("check_in_date", todayStr)
        .lte("check_in_date", maxIncomingStr);
    } else if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    // Apply Payment Status filter
    if (paymentStatusFilter) {
      query = query.eq("payment_status", paymentStatusFilter);
    }

    // Apply Check-in Date filter
    if (checkInDate) {
      query = query.eq("check_in_date", checkInDate);
    }

    // Apply Created Date filter
    if (createdDate) {
      query = query
        .gte("created_at", `${createdDate}T00:00:00Z`)
        .lte("created_at", `${createdDate}T23:59:59Z`);
    }

    // Apply City Filter
    if (cityHomestayIds !== null) {
      if (cityHomestayIds.length > 0) {
        query = query.in("homestay_id", cityHomestayIds);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Force 0 results
      }
    }

    // Apply Owner Filter
    if (ownerHomestayIds !== null) {
      if (ownerHomestayIds.length > 0) {
        query = query.in("homestay_id", ownerHomestayIds);
      } else {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Force 0 results
      }
    }

    // Apply Search Query
    if (q) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      let orParts: string[] = [`booking_code.ilike.%${q}%`];
      if (isUuid) {
        orParts.push(`id.eq.${q}`);
      }
      if (matchedUserIds.length > 0) {
        orParts.push(`user_id.in.(${matchedUserIds.join(",")})`);
      }
      if (matchedHomestayIds.length > 0) {
        orParts.push(`homestay_id.in.(${matchedHomestayIds.join(",")})`);
      }
      query = query.or(orParts.join(","));
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    dbError = error;
    if (data) {
      bookingsData = data;
      totalCount = count || 0;
    }
  } catch (err) {
    dbError = err;
  }

  // Fallback: If migration hasn't been executed yet and booking_code/payment_status column is missing
  if (dbError && (dbError.code === "42703" || String(dbError.message || "").includes("booking_code") || String(dbError.message || "").includes("payment_status"))) {
    console.warn("Database bookings table is missing booking_code or payment_status column. Running fallback in-memory mapping query.");
    try {
      let query = supabaseAdmin
        .from("bookings")
        .select(
          `
            id,
            check_in_date,
            check_out_date,
            guests,
            total_price,
            status,
            created_at,
            guest:profiles!bookings_user_id_fkey(id, full_name, email),
            homestay:homestays!bookings_homestay_id_fkey(
              id,
              name,
              city,
              owner_id,
              owner:profiles!homestays_owner_id_fkey(id, full_name, email)
            )
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (statusFilter === "INCOMING") {
        query = query
          .eq("status", "CONFIRMED")
          .gte("check_in_date", todayStr)
          .lte("check_in_date", maxIncomingStr);
      } else if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (checkInDate) {
        query = query.eq("check_in_date", checkInDate);
      }

      if (createdDate) {
        query = query
          .gte("created_at", `${createdDate}T00:00:00Z`)
          .lte("created_at", `${createdDate}T23:59:59Z`);
      }

      if (cityHomestayIds !== null) {
        if (cityHomestayIds.length > 0) {
          query = query.in("homestay_id", cityHomestayIds);
        } else {
          query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      if (ownerHomestayIds !== null) {
        if (ownerHomestayIds.length > 0) {
          query = query.in("homestay_id", ownerHomestayIds);
        } else {
          query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      if (q) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
        let orParts: string[] = [];
        if (isUuid) {
          orParts.push(`id.eq.${q}`);
        }
        if (matchedUserIds.length > 0) {
          orParts.push(`user_id.in.(${matchedUserIds.join(",")})`);
        }
        if (matchedHomestayIds.length > 0) {
          orParts.push(`homestay_id.in.(${matchedHomestayIds.join(",")})`);
        }
        
        if (orParts.length > 0) {
          query = query.or(orParts.join(","));
        } else {
          // If query is set but didn't match any users/homestays and is not UUID, force 0 results
          query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      const { data, count, error } = await query.range(offset, offset + limit - 1);
      dbError = error;
      if (data) {
        bookingsData = data.map((bk: any) => ({
          ...bk,
          booking_code: `BK-${bk.id.slice(0, 8).toUpperCase()}`,
          payment_status: bk.status === "CONFIRMED" || bk.status === "COMPLETED" ? "PAID" : "UNPAID",
          cancel_reason: null,
          special_requests: null,
        }));
        totalCount = count || 0;
      }
    } catch (err) {
      dbError = err;
    }
  }

  if (dbError) {
    console.error("Lỗi lấy danh sách đơn đặt phòng admin:", {
      message: dbError.message,
      code: dbError.code,
      details: dbError.details,
      hint: dbError.hint,
      stack: dbError.stack,
      raw: dbError
    });
  }

  const parsedBookings = ((bookingsData || []) as any[]).map((bk) => {
    const guestData = Array.isArray(bk.guest) ? bk.guest[0] : bk.guest;
    const homestayRaw = Array.isArray(bk.homestay) ? bk.homestay[0] : bk.homestay;
    let homestayData = null;
    if (homestayRaw) {
      const ownerRaw = Array.isArray(homestayRaw.owner) ? homestayRaw.owner[0] : homestayRaw.owner;
      homestayData = {
        ...homestayRaw,
        owner: ownerRaw || null,
      };
    }
    return {
      ...bk,
      booking_code: bk.booking_code || `BK-${bk.id.slice(0, 8).toUpperCase()}`,
      payment_status: bk.payment_status || (bk.status === "CONFIRMED" || bk.status === "COMPLETED" ? "PAID" : "UNPAID"),
      guest: guestData || null,
      homestay: homestayData || null,
    } as BookingRow;
  });

  // 3. Query exact lightweight counts for each status tab
  const getCountQuery = async (statusVal?: string, isIncoming = false) => {
    try {
      let qCount = supabaseAdmin.from("bookings").select("id", { count: "exact", head: true });
      if (isIncoming) {
        qCount = qCount
          .eq("status", "CONFIRMED")
          .gte("check_in_date", todayStr)
          .lte("check_in_date", maxIncomingStr);
      } else if (statusVal) {
        qCount = qCount.eq("status", statusVal);
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
    countConfirmed,
    countIncoming,
    countCheckedIn,
    countCompleted,
    countCancelled,
    countNoShow,
  ] = await Promise.all([
    getCountQuery(),
    getCountQuery("PENDING"),
    getCountQuery("CONFIRMED"),
    getCountQuery(undefined, true),
    getCountQuery("CHECKED_IN"),
    getCountQuery("COMPLETED"),
    getCountQuery("CANCELLED"),
    getCountQuery("NO_SHOW"),
  ]);

  const tabCounts = {
    all: countAll,
    pending: countPending,
    confirmed: countConfirmed,
    incoming: countIncoming,
    checkedIn: countCheckedIn,
    completed: countCompleted,
    cancelled: countCancelled,
    noShow: countNoShow,
  };

  return (
    <AdminShell
      title="Đơn đặt phòng"
      description="Hệ thống quản trị OTA đặt phòng StaySaga. Quản lý trạng thái, lịch đặt, thông tin khách hàng và thanh toán."
      activePath="/admin/bookings"
    >
      <AdminBookingsClient
        bookings={parsedBookings}
        totalItems={totalCount}
        itemsPerPage={limit}
        tabCounts={tabCounts}
        cities={cities}
      />
      <RealtimeSubscription table="bookings" />
    </AdminShell>
  );
}
