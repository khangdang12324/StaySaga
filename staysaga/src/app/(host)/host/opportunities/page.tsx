import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { getHostDashboardData } from "@/core/host/actions";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { OpportunityDashboard } from "../_components/OpportunityDashboard";

export default async function HostOpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/opportunities");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { listings } = await getHostDashboardData();
  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  const cleanListings = listings.map((l) => ({
    id: l.id,
    name: l.name || "Chỗ nghỉ chưa đặt tên",
  }));

  return (
    <HostExtranetShell active="opportunities" userName={userName}>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        <h1 className="text-3xl font-black text-slate-900">Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ</h1>
        <p className="mt-3 text-slate-700 max-w-4xl text-sm leading-relaxed">
          Giúp nâng cao hiệu suất hoạt động bằng các cơ hội cải thiện nhiều khía cạnh khác nhau của chỗ nghỉ
        </p>

        <OpportunityDashboard initialListings={cleanListings} />
      </main>
    </HostExtranetShell>
  );
}

