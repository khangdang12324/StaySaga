import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MessageSquare,
  Sparkles,
  Users,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/core/auth/actions";
import {
  canAccessAdmin,
  getProfileStatus,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const authSupabase = supabase as unknown as SupabaseLike;
  const role = await getUserRole(authSupabase, session.user.id);
  const status = await getProfileStatus(authSupabase, session.user.id);

  if (status === "BLOCKED" || !canAccessAdmin(role)) {
    redirect("/");
  }

  return { supabase, user: session.user };
}

export function AdminShell({
  title,
  description,
  children,
  activePath = "/admin",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  activePath?: string;
}) {
  const navClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      activePath === path
        ? "bg-rose-600 font-bold text-white shadow-md shadow-rose-900/20"
        : "text-slate-200 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen bg-[#F7F9FC] font-sans">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col bg-[#0F172A] text-slate-200 shadow-xl md:flex">
        <div className="flex h-16 items-center border-b border-slate-800 bg-[#0B1121] px-6">
          <span className="text-2xl font-black tracking-tight text-white">
            Stay<span className="text-rose-500">Saga</span>
          </span>
          <span className="ml-2 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
            ADMIN
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-300">
            Quản trị hệ thống
          </p>
          <nav className="space-y-1">
            <Link href="/admin" className={navClass("/admin")}>
              <LayoutDashboard className="h-4 w-4" /> Bảng điều khiển
            </Link>
            <Link href="/admin/users" className={navClass("/admin/users")}>
              <Users className="h-4 w-4" /> Người dùng
            </Link>
            <Link href="/admin/partners" className={navClass("/admin/partners")}>
              <UserCheck className="h-4 w-4" /> Đối tác
            </Link>
            <Link href="/admin/properties" className={navClass("/admin/properties")}>
              <Building2 className="h-4 w-4" /> Chỗ nghỉ
            </Link>
            <Link href="/admin/bookings" className={navClass("/admin/bookings")}>
              <Calendar className="h-4 w-4" /> Đơn đặt phòng
            </Link>
            <Link href="/admin/reviews" className={navClass("/admin/reviews")}>
              <MessageSquare className="h-4 w-4" /> Đánh giá
            </Link>
            <Link href="/admin/settings" className={navClass("/admin/settings")}>
              <Sparkles className="h-4 w-4 text-amber-300" /> Cài đặt website
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-800 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LifeBuoy className="h-4 w-4" /> Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="text-slate-700 transition-colors hover:text-slate-950 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">{title || "Trang quản trị StaySaga"}</h1>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative text-slate-600 transition-colors hover:text-slate-900">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="group relative flex cursor-pointer items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold leading-tight text-slate-900">
                  Admin System
                </p>
                <p className="text-xs font-medium text-slate-700">
                  Quản trị viên cấp cao
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-100 font-bold text-rose-600">
                AD
              </div>
              <ChevronDown className="h-4 w-4 text-slate-600" />
              <div className="invisible absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                <Link
                  href="/"
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                >
                  Về trang chủ
                </Link>
                <Link
                  href="/profile"
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                >
                  Hồ sơ của tôi
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Đăng xuất
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {(title || description) && (
            <div className="mb-8">
              {title && (
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
