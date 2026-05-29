import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { EmptyState } from "@/components/host/EmptyState";
import { HostPageHeader } from "@/components/host/HostPageHeader";

export default async function HostCalendarRedirectPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/calendar");

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
    // Redirect to the first property's calendar
    redirect(`/host/${homestays[0].id}/calendar`);
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="calendar" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title="Lịch và Tình trạng phòng trống"
          description="Quản lý lịch mở bán phòng, giá và quy tắc giới hạn đặt phòng."
          breadcrumbs={[{ label: "Giá & Tình trạng phòng trống" }, { label: "Lịch" }]}
        />
        <EmptyState
          title="Chưa có chỗ nghỉ nào"
          description="Vui lòng tạo chỗ nghỉ đầu tiên để bắt đầu quản lý lịch phòng."
          actionHref="/host/register?new=1"
          actionLabel="Thêm chỗ nghỉ mới"
        />
      </main>
    </HostExtranetShell>
  );
}
