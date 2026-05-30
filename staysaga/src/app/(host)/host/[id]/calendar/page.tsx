import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Search } from "lucide-react";
import { HostAccountMenu } from "../../_components/HostAccountMenu";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { HostTopNav } from "@/components/host/HostTopNav";

type Props = { params: Promise<{ id: string }> };

async function getProperty(id: string, userId: string) {
  const supabase = await createClient();
  let { data } = await supabase
    .from("homestays")
    .select("id, name, owner_id")
    .eq("id", id)
    .eq("owner_id", userId)
    .single();

  if (!data) {
    const admin = await createAdminClient();
    const retry = await admin
      .from("homestays")
      .select("id, name, owner_id")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();
    data = retry.data;
  }

  return data;
}

export default async function AvailabilityCalendarPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");
  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { id } = await params;
  const property = await getProperty(id, session.user.id);
  if (!property) notFound();

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#1a1a1a]">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
          <Link href="/host" className="text-3xl font-bold">
            StaySaga
          </Link>
          <span className="hidden h-8 w-px bg-white/35 md:block" />
          <div className="hidden md:block">
            <p className="font-bold">{property.name || "Chỗ nghỉ"}</p>
            <p className="text-sm text-white/80">ID {property.id.slice(0, 8)}</p>
          </div>
          <div className="ml-auto hidden h-12 w-full max-w-[540px] items-center rounded-sm bg-white/10 px-4 lg:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <HostAccountMenu userName={userName} />
        </div>
        <HostTopNav propertyId={property.id} />
      </header>
      <AvailabilityCalendar propertyName={property.name || "Chỗ nghỉ"} propertyId={property.id} />
    </div>
  );
}
