import { redirect } from "next/navigation";
import PropertyRegistrationWizard from "./PropertyRegistrationWizard";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Đăng chỗ nghỉ | StaySaga",
};

export default async function HostRegisterPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/register");

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  return <PropertyRegistrationWizard />;
}
