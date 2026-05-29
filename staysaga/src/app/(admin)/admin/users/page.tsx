import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminUserActions } from "./AdminUserActions";
import type { AppRole, ProfileStatus } from "@/lib/auth/roles";
import { Search, UserCheck, ShieldAlert, Ban } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";
import { ServerPagination } from "@/components/ui/ServerPagination";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    q?: string;
    role?: string;
    status?: string;
    error?: string;
    page?: string;
  }>;
};

type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  avatar_url: string | null;
  bookings: { id: string }[] | null;
};

const errorMessages: Record<string, string> = {
  invalid: "Dữ liệu phân quyền không hợp lệ.",
  self_lock:
    "Không thể tự hạ quyền hoặc khóa chính tài khoản ADMIN đang đăng nhập.",
  update_failed: "Lưu phân quyền thất bại. Vui lòng kiểm tra RLS hoặc DB.",
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const { user: currentUser } = await requireAdmin();
  const params = searchParams ? await searchParams : {};

  const q = params.q?.trim() || "";
  const roleFilter = params.role?.trim() || "";
  const statusFilter = params.status?.trim() || "";

  const page = Number(params.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  let totalCount = 0;

  const supabaseAdmin = await createAdminClient();

  let usersData: any[] | null = null;
  let dbError: any = null;

  try {
    let query = supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, email, role, status, created_at, avatar_url, bookings:bookings(id)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }
    if (roleFilter) {
      query = query.eq("role", roleFilter);
    }
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, count, error } = await query.range(
      offset,
      offset + limit - 1,
    );
    usersData = data;
    totalCount = count || 0;
    dbError = error;
  } catch (err) {
    dbError = err;
  }

  // Fallback if status column does not exist (code 42703)
  if (
    dbError &&
    (dbError.code === "42703" ||
      String(dbError.message || "").includes("status"))
  ) {
    console.warn(
      "Database profiles table is missing 'status' column. Falling back to in-memory handling.",
    );
    try {
      let query = supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, email, role, created_at, avatar_url, bookings:bookings(id)",
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (q) {
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
      }
      if (roleFilter) {
        query = query.eq("role", roleFilter);
      }

      const { data, count, error } = await query.range(
        offset,
        offset + limit - 1,
      );
      dbError = error;
      if (data) {
        usersData = data.map((u: any) => ({ ...u, status: "ACTIVE" }));
        totalCount = count || 0;
        if (statusFilter) {
          usersData = usersData.filter((u: any) => u.status === statusFilter);
          totalCount = usersData.length;
        }
      }
    } catch (err) {
      dbError = err;
    }
  }

  const users = (usersData || []) as AdminUserRow[];

  if (dbError) {
    console.error("Lỗi khi truy vấn danh sách người dùng:", dbError);
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminShell
      title="Người dùng & Phân quyền"
      description="Quản lý thành viên hệ thống StaySaga. Cấp quyền hoặc khóa tài khoản vi phạm chính sách."
      activePath="/admin/users"
    >
      {params.error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-800 shadow-sm flex items-center gap-2">
          <Ban className="h-5 w-5 text-rose-600 shrink-0" />
          {errorMessages[params.error] || "Lỗi thao tác trên tài khoản."}
        </div>
      )}

      {/* Filter panel */}
      <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4 items-end mb-6">
        <div className="block md:col-span-2">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Tìm kiếm thành viên
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none focus:border-rose-500 transition-colors"
              placeholder="Nhập tên hoặc email..."
            />
          </div>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Vai trò (Role)
          </span>
          <select
            name="role"
            defaultValue={roleFilter}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 transition-colors cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">USER (Khách hàng)</option>
            <option value="PARTNER">PARTNER (Đối tác)</option>
            <option value="ADMIN">ADMIN (Quản trị viên)</option>
          </select>
        </div>

        <div className="block">
          <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-600">
            Trạng thái
          </span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-rose-500 transition-colors cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE (Hoạt động)</option>
            <option value="BLOCKED">BLOCKED (Đã khóa)</option>
          </select>
        </div>

        <div className="md:col-span-4 flex justify-end">
          <button className="rounded-lg bg-rose-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-rose-950/10 hover:bg-rose-700 transition-colors">
            Lọc dữ liệu
          </button>
        </div>
      </form>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Thành viên</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">Vai trò</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 whitespace-nowrap">Số booking</th>
                <th className="px-6 py-4 whitespace-nowrap">Ngày tham gia</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">
                  Thao tác hệ thống
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500 font-bold"
                  >
                    Không tìm thấy thành viên nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isSelf = item.id === currentUser.id;
                  const role = (item.role || "USER") as AppRole;
                  const status = (item.status || "ACTIVE") as ProfileStatus;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors align-middle"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={item.avatar_url}
                            alt={item.full_name || "Avatar"}
                            className="h-9 w-9"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-snug whitespace-nowrap">
                              {item.full_name || "Chưa cập nhật tên"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              ID: {item.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {item.email || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black whitespace-nowrap ${
                            role === "ADMIN"
                              ? "bg-purple-100 text-purple-800"
                              : role === "PARTNER"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {role === "ADMIN" && (
                            <ShieldAlert className="h-3 w-3" />
                          )}
                          {role === "PARTNER" && (
                            <UserCheck className="h-3 w-3" />
                          )}
                          {role === "USER" && <UserCheck className="h-3 w-3" />}
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black whitespace-nowrap ${
                            status === "BLOCKED"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900 whitespace-nowrap">
                        {item.bookings?.length || 0} đơn đặt
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AdminUserActions
                          userId={item.id}
                          currentRole={role}
                          currentStatus={status}
                          userName={
                            item.full_name || item.email || "Thành viên"
                          }
                          isSelf={isSelf}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ServerPagination totalItems={totalCount} itemsPerPage={limit} />
      <RealtimeSubscription table="profiles" />
    </AdminShell>
  );
}
