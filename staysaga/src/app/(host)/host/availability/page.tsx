import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { ListingActionsDropdown } from "../_components/ListingActionsDropdown";
import { AlertCircle } from "lucide-react";

export default async function HostAvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/availability");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch host properties
  const { data: homestays } = await supabase
    .from("homestays")
    .select("id, name, address, city, price_per_night, is_active, status, registration_checklist")
    .eq("owner_id", session.user.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="calendar" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title="Mở / đóng chỗ nghỉ"
          description="Kiểm soát trạng thái hiển thị của các chỗ nghỉ của bạn trên StaySaga. Khách hàng chỉ có thể đặt phòng khi chỗ nghỉ được Mở bán."
          breadcrumbs={[{ label: "Giá & Tình trạng phòng trống" }, { label: "Mở/đóng phòng" }]}
        />

        {!homestays || homestays.length === 0 ? (
          <EmptyState
            title="Chưa có chỗ nghỉ nào"
            description="Tạo chỗ nghỉ đầu tiên để bắt đầu cài đặt mở/đóng bán phòng."
            actionHref="/host/register?new=1"
            actionLabel="Đăng ký ngay"
          />
        ) : (
          <div className="space-y-6">
            <div className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800 flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Lưu ý về quy trình duyệt chỗ nghỉ:</p>
                <p className="mt-1">
                  Chỗ nghỉ mới tạo cần được quản trị viên duyệt trước khi có thể chuyển sang trạng thái hoạt động chính thức. Các chỗ nghỉ ở trạng thái nháp (DRAFT) cần hoàn thiện các thông tin cơ bản trước.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-250 bg-white">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-gray-250 bg-gray-50/50">
                  <tr>
                    <th className="px-5 py-4 font-bold text-slate-700">Tên chỗ nghỉ</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Vị trí</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Giá mỗi đêm</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Trạng thái duyệt</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Tình trạng mở bán</th>
                    <th className="px-5 py-4 font-bold text-right text-slate-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {homestays.map((item) => {
                    const placeholderNames = [
                      "ChÃ¡Â»â€” nghÃ¡Â»â€° chÃ†Â°a Ã„â€˜Ã¡ÂºÂ·t tÃƒÂªn",
                      "Cho nghi chua dat ten",
                      "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn",
                      "Chỗ nghỉ chưa đặt tên",
                    ];
                    const rawName = item.name?.trim() || "";
                    const isPlaceholder = !rawName || placeholderNames.includes(rawName);
                    const draftName = (item.registration_checklist as any)?.draftState?.name;
                    const displayName = (isPlaceholder && draftName && typeof draftName === "string" && draftName.trim())
                      ? draftName.trim()
                      : (item.name || "Chỗ nghỉ chưa đặt tên");

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-5 font-bold text-slate-900">
                          <Link href={`/host/${item.id}`} className="hover:text-[#f60057] hover:underline">
                            {displayName}
                          </Link>
                        </td>
                      <td className="px-5 py-5 text-slate-600">
                        {item.address ? `${item.address}, ` : ""}{item.city}
                      </td>
                      <td className="px-5 py-5 font-semibold text-slate-900">
                        {item.price_per_night
                          ? `${new Intl.NumberFormat("vi-VN").format(Number(item.price_per_night))} VND`
                          : "Chưa đặt giá"}
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            item.status === "APPROVED"
                              ? "text-emerald-700"
                              : item.status === "PENDING"
                                ? "text-amber-700"
                                : "text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              item.status === "APPROVED"
                                ? "bg-emerald-500"
                                : item.status === "PENDING"
                                  ? "bg-amber-400"
                                  : "bg-slate-400"
                            }`}
                          />
                          {item.status === "APPROVED"
                            ? "Đã duyệt"
                            : item.status === "PENDING"
                              ? "Chờ duyệt"
                              : item.status || "Bản nháp"}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${
                            item.is_active && item.status === "APPROVED"
                              ? "bg-emerald-700"
                              : "bg-[#f60057]"
                          }`}
                        >
                          {item.is_active && item.status === "APPROVED" ? "Đang mở bán" : "Đang đóng"}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <ListingActionsDropdown
                          propertyId={item.id}
                          status={item.status || "APPROVED"}
                          isActive={item.is_active}
                        />
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </HostExtranetShell>
  );
}
