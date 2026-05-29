import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { EmptyState } from "@/components/host/EmptyState";
import { HostPageHeader } from "@/components/host/HostPageHeader";

export default async function HostRatesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/rates");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch host properties
  const { data: homestays } = await supabase
    .from("homestays")
    .select("id")
    .eq("owner_id", session.user.id)
    .neq("status", "DELETED")
    .limit(1);

  if (homestays && homestays.length > 0) {
    // Redirect to the first property's rate plans
    redirect(`/host/${homestays[0].id}/calendar/rate-plans`);
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="calendar" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title="Loại giá (Rate Plans)"
          description="Cài đặt và quản lý các nhóm giá bán phòng khác nhau cho các phân khúc khách hàng."
          breadcrumbs={[{ label: "Giá & Tình trạng phòng trống" }, { label: "Loại giá" }]}
        />
        <EmptyState
          title="Chưa có chỗ nghỉ nào"
          description="Vui lòng tạo chỗ nghỉ đầu tiên để bắt đầu cài đặt các loại giá bán."
          actionHref="/host/register?new=1"
          actionLabel="Đăng ký ngay"
        />
      </main>
    </HostExtranetShell>
  );
}
