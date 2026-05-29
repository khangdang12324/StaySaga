import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { EmptyState } from "@/components/host/EmptyState";
import { HostPageHeader } from "@/components/host/HostPageHeader";

export default async function HostPromotionsRedirectPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/promotions");

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
    // Redirect to the first property's promotions chooser
    redirect(`/host/${homestays[0].id}/promotions`);
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="opportunities" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <HostPageHeader
          title="Chương trình khuyến mãi"
          description="Thiết lập các chương trình giảm giá, kích cầu đặt phòng vào dịp lễ hoặc đối với khách hàng thân thiết."
          breadcrumbs={[{ label: "Chương trình khuyến mãi" }]}
        />
        <EmptyState
          title="Chưa có chỗ nghỉ nào"
          description="Vui lòng đăng ký chỗ nghỉ trước khi tạo chương trình khuyến mãi."
          actionHref="/host/register?new=1"
          actionLabel="Đăng ký ngay"
        />
      </main>
    </HostExtranetShell>
  );
}
