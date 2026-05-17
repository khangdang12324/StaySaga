import { AdminShell, requireAdmin } from "../_components/AdminShell";
import { updatePropertyStatus } from "@/core/admin/actions";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminPropertiesPage() {
  await requireAdmin();
  const supabaseAdmin = await createAdminClient();
  const { data: properties } = await supabaseAdmin
    .from("homestays")
    .select("id, name, city, price_per_night, is_active, status, owner:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AdminShell
      title="Quản lý Chỗ nghỉ (Properties)"
      description="ADMIN có thể xem toàn bộ chỗ nghỉ, duyệt PENDING sang APPROVED hoặc từ chối REJECTED."
      activePath="/admin/properties"
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mt-6">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Chỗ nghỉ</th>
              <th className="px-6 py-4 font-bold">Chủ sở hữu (Host)</th>
              <th className="px-6 py-4 font-bold">Giá/Đêm</th>
              <th className="px-6 py-4 font-bold">Trạng thái</th>
              <th className="px-6 py-4 font-bold text-right">Duyệt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(properties || []).map((property) => {
              const owner = Array.isArray(property.owner) ? property.owner[0] : property.owner;
              return (
                <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{property.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{property.city}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {owner?.full_name || owner?.email || "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {Number(property.price_per_night || 0).toLocaleString("vi-VN")} VND
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2.5 py-1 text-xs font-bold ${
                      property.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      property.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      property.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {property.status || "APPROVED"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <form action={updatePropertyStatus} className="flex justify-end gap-2">
                      <input type="hidden" name="id" value={property.id} />
                      <select
                        name="status"
                        defaultValue={property.status || "APPROVED"}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-rose-500 font-semibold"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                      <button className="rounded-lg bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 transition-colors">
                        Lưu
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
