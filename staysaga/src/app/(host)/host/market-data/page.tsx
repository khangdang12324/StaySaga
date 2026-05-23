import { redirect } from "next/navigation";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { MarketDataDashboard } from "../_components/MarketDataDashboard";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function HostMarketDataPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/market-data");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const userName =
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Tài khoản đối tác";

  // Fetch the host's listings
  const { data: listings } = await supabase
    .from("homestays")
    .select("id, name, address, city")
    .eq("owner_id", session.user.id);

  return (
    <HostExtranetShell active="market-data" userName={userName}>
      <MarketDataDashboard listings={listings || []} />
    </HostExtranetShell>
  );
}
