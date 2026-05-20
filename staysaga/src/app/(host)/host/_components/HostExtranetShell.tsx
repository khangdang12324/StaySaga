import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Home,
  Inbox,
  LineChart,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Star,
  WalletCards,
} from "lucide-react";
import { logout } from "@/core/auth/actions";
import { HostAccountMenu } from "./HostAccountMenu";

type HostNavKey =
  | "home"
  | "list"
  | "new"
  | "calendar"
  | "bookings"
  | "reviews"
  | "messages"
  | "finance"
  | "analytics"
  | "bulk"
  | "opportunities"
  | "market-data"
  | "revenue";

type HostExtranetShellProps = {
  active: HostNavKey;
  userName: string;
  children: ReactNode;
  hideNav?: boolean;
};

const navItems: { key: HostNavKey; label: string; href: string; icon: ReactNode }[] = [
  { key: "home", label: "Tổng quan", href: "/host", icon: <Home className="h-5 w-5" /> },
  { key: "list", label: "Chỗ nghỉ của tôi", href: "/host/list", icon: <Inbox className="h-5 w-5" /> },
  { key: "new", label: "Thêm chỗ nghỉ mới", href: "/host/properties/new", icon: <Plus className="h-5 w-5" /> },
  { key: "calendar", label: "Giá & lịch trống", href: "/host/calendar", icon: <CalendarDays className="h-5 w-5" /> },
  { key: "bookings", label: "Đơn đặt phòng", href: "/host/bookings", icon: <CalendarDays className="h-5 w-5" /> },
  { key: "reviews", label: "Đánh giá của khách", href: "/host/reviews", icon: <Star className="h-5 w-5" /> },
  { key: "messages", label: "Tin nhắn", href: "/host/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { key: "finance", label: "Tài chính", href: "/host/finance", icon: <WalletCards className="h-5 w-5" /> },
  { key: "analytics", label: "Phân tích hiệu suất", href: "/host/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { key: "bulk", label: "Chỉnh sửa đồng loạt", href: "/host/bulk", icon: <LineChart className="h-5 w-5" /> },
  { key: "opportunities", label: "Trung tâm Cơ hội", href: "/host/opportunities", icon: <LineChart className="h-5 w-5" /> },
  { key: "market-data", label: "Dữ liệu thị trường", href: "/host/market-data", icon: <BarChart3 className="h-5 w-5" /> },
];

export function HostExtranetShell({ active, userName, children, hideNav = false }: HostExtranetShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-rose-700/20 bg-[#f60057] text-white shadow-sm">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="text-2xl font-black tracking-tight">
            StaySaga<span>.</span>
          </Link>
          <div className="hidden h-8 w-px bg-white/35 md:block" />
          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <span className="truncate font-bold">{userName}</span>
            <span className="rounded bg-white/15 px-2 py-1 text-xs font-bold ring-1 ring-white/30">Đối tác</span>
          </div>
          <div className="ml-auto hidden h-11 w-full max-w-md items-center rounded bg-white/12 px-4 md:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <Link href="/" className="hidden rounded border border-white/35 px-3 py-2 text-sm font-bold hover:bg-white/10 md:inline-flex">
            Xem website
          </Link>
          <Bell className="h-6 w-6" />
          <HostAccountMenu userName={userName} />
        </div>
      </header>

      <div className="flex">
        {!hideNav && (
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                    active === item.key ? "bg-rose-50 text-[#f60057]" : "text-slate-700 hover:bg-slate-50 hover:text-[#f60057]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={logout} className="mt-6 border-t border-slate-100 pt-4">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-[#f60057]">
                <LogOut className="h-5 w-5" />
                Đăng xuất
              </button>
            </form>
          </aside>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
