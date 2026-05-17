import Link from "next/link";
import { redirect } from "next/navigation";
import { HelpCircle, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { PropertyRegistrationWizard } from "./PropertyRegistrationWizard";

export const metadata = {
  title: "Đăng chỗ nghỉ | StaySaga",
};

export default async function HostRegisterPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login?next=/host/register");
  }

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );

  if (!canAccessPartner(role)) {
    redirect("/host/onboard");
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-slate-950">
      <header className="h-[76px] bg-[#071d49] text-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Stay<span className="text-rose-400">Saga</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <span className="rounded-sm bg-rose-600 px-2 py-1 text-xs">VN</span>
            <Link href="/help" className="flex items-center gap-2 hover:text-rose-100">
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
