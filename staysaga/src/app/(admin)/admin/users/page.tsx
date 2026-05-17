import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { updateUserAccess } from "@/core/admin/actions";
import { createAdminClient } from "@/lib/supabase/server";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status?: string | null;
  created_at: string;
};

const errorMessages: Record<string, string> = {
  invalid: "Dữ liệu phân quyền không hợp lệ.",
  self_lock: "Không thể tự hạ quyền hoặc khóa chính tài khoản ADMIN đang đăng nhập.",
  update_failed: "Lưu phân quyền thất bại. Kiểm tra cấu hình Supabase hoặc RLS.",
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = searchParams ? await searchParams : {};
  await requireAdmin();

  const supabaseAdmin = await createAdminClient();
  const { data: usersWithStatus, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  let users = (usersWithStatus || []) as AdminUserRow[];
  const statusColumnMissing =
    error && String(error.message || "").toLowerCase().includes("status");

  if (statusColumnMissing) {
    const { data: fallbackUsers, error: fallbackError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    users = (fallbackUsers || []).map((user) => ({
      ...user,
      status: "ACTIVE",
    })) as AdminUserRow[];

    if (fallbackError) {
      console.error("Lỗi khi lấy danh sách users:", fallbackError);
    }
  } else if (error) {
    console.error("Lỗi khi lấy danh sách users:", error);
  }

  return (
    <AdminShell
      title="Quản lý Người dùng"
      description="ADMIN có thể khóa/mở khóa tài khoản và đổi role USER/PARTNER để phân quyền."
      activePath="/admin/users"
    >
      {params.status === "updated" && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          Đã lưu phân quyền thành công.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {errorMessages[params.error] || "Không thể lưu phân quyền."}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-100 text-xs uppercase tracking-wide text-slate-800">
            <tr>
              <th className="px-6 py-4 font-bold">Người dùng</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Phân quyền</th>
              {!statusColumnMissing && (
                <th className="px-6 py-4 font-bold">Trạng thái</th>
              )}
              <th className="px-6 py-4 text-right font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-950">
                  {user.full_name || "Chưa cập nhật"}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  {user.email || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded px-2.5 py-1 text-xs font-bold ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "PARTNER"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {user.role || "USER"}
                  </span>
                </td>
                {!statusColumnMissing && (
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2.5 py-1 text-xs font-bold ${
                        user.status === "BLOCKED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {user.status || "ACTIVE"}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  <form action={updateUserAccess} className="flex justify-end gap-2">
                    <input type="hidden" name="id" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role || "USER"}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-950 opacity-100 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                    >
                      <option value="USER">USER</option>
                      <option value="PARTNER">PARTNER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    {!statusColumnMissing && (
                      <select
                        name="status"
                        defaultValue={user.status || "ACTIVE"}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-950 opacity-100 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    )}
                    <button className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white transition-colors hover:bg-rose-700">
                      Lưu
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
