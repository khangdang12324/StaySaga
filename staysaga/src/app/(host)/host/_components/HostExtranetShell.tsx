import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Globe2,
  Search,
} from "lucide-react";
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

const navItems: { key: HostNavKey; label: string; href: string }[] = [
  { key: "home", label: "Trang chủ Nhóm chỗ nghỉ", href: "/host" },
  { key: "bookings", label: "Đặt phòng", href: "/host/bookings" },
  { key: "messages", label: "Hộp thư", href: "/host/messages" },
  { key: "revenue", label: "Doanh thu chiến lược", href: "/host/revenue" },
  { key: "reviews", label: "Đánh giá", href: "/host/reviews" },
  { key: "finance", label: "Tài chính", href: "/host/finance" },
  { key: "bulk", label: "Chỉnh sửa đồng loạt", href: "/host/bulk" },
  {
    key: "opportunities",
    label: "Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ",
    href: "/host/opportunities",
  },
];

export function HostExtranetShell({
  active,
  userName,
  children,
  hideNav = false,
}: HostExtranetShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#1a1a1a]">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
          <Link href="/host" className="text-3xl font-bold tracking-tight">
            StaySaga
          </Link>
          <div className="hidden h-8 w-px bg-white/40 lg:block" />
          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <span className="max-w-[260px] truncate font-semibold">
              {userName}
            </span>
            <span className="rounded-sm bg-emerald-600 px-2 py-1 text-xs font-bold">
              Tài khoản chính
            </span>
          </div>
          <div className="ml-auto hidden h-11 w-full max-w-[520px] items-center rounded-sm bg-white/10 px-4 ring-1 ring-white/10 lg:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <Link
            href="/host/list"
            className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/15 text-lg font-bold ring-1 ring-white/25 lg:flex"
          >
            ★
          </Link>
          <Link
            href="/settings"
            className="hidden items-center gap-2 font-semibold lg:inline-flex"
          >
            <Globe2 className="h-5 w-5" />
            Tiếng Việt
          </Link>
          <Link
            href="/help"
            className="hidden items-center gap-2 font-semibold lg:inline-flex"
          >
            <CircleHelp className="h-5 w-5" />
            Trợ giúp
          </Link>
          <Bell className="h-6 w-6" />
          <HostAccountMenu userName={userName} />
        </div>

        {!hideNav ? (
          <nav className="mx-auto flex max-w-[1400px] items-end overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`whitespace-nowrap px-4 py-5 text-[15px] font-medium transition ${
                  active === item.key
                    ? "bg-white/12 text-white"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/host/list"
              className="inline-flex items-center gap-1 whitespace-nowrap px-4 py-5 text-[15px] font-medium hover:bg-white/10"
            >
              Khác
              <ChevronDown className="h-4 w-4" />
            </Link>
          </nav>
        ) : null}
      </header>

      {children}
    </div>
  );
}
