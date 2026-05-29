import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { EmptyState } from "@/components/host/EmptyState";
import { HostPageHeader } from "@/components/host/HostPageHeader";

export default async function HostSyncRedirectPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/sync");

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
    // Redirect to the first property's sync settings
    redirect(`/host/${homestays[0].id}/sync`);
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="calendar" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title="Đồng bộ hóa lịch"
          description="Đồng bộ lịch đặt phòng của StaySaga với các kênh OTA khác như Booking.com, Airbnb, Agoda qua kết nối iCal."
          breadcrumbs={[{ label: "Giá & Tình trạng phòng trống" }, { label: "Đồng bộ hóa lịch" }]}
        />
        <EmptyState
          title="Chưa có chỗ nghỉ nào"
          description="Vui lòng tạo chỗ nghỉ đầu tiên để bắt đầu thiết lập đồng bộ lịch."
          actionHref="/host/register?new=1"
          actionLabel="Đăng ký chỗ nghỉ"
        />
      </main>
    </HostExtranetShell>
  );
}
