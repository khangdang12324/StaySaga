import Link from "next/link";
import { redirect } from "next/navigation";
import { HelpCircle, UserCircle } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-950">
      <header className="h-[72px] bg-[#f60057] text-white">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-[28px] font-bold tracking-tight">
            StaySaga.
          </Link>
          <div className="flex items-center gap-5 text-[15px] font-semibold">
            <span className="rounded-full border border-white/40 px-3 py-1 text-sm">
              VN
            </span>
            <Link
              href="/help"
              className="flex items-center gap-2 hover:text-white/80"
            >
              Trợ giúp <HelpCircle className="h-5 w-5" />
            </Link>
            <Link href="/profile" aria-label="Tài khoản">
              <UserCircle className="h-8 w-8" />
            </Link>
          </div>
        </div>
      </header>

      <PropertyRegistrationWizard />
    </div>
  );
}
