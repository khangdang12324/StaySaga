"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Bell, ChevronDown, CircleHelp, Globe2, Search } from "lucide-react";
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
          <Link href="/host" className="shrink-0 text-3xl font-bold tracking-tight">
            StaySaga
          </Link>
          <div className="hidden h-8 w-px shrink-0 bg-white/40 lg:block" />
          <div className="hidden min-w-0 shrink-0 items-center gap-3 lg:flex">
            <span className="max-w-[120px] truncate font-semibold xl:max-w-[260px]">
              {userName}
            </span>
            <span className="shrink-0 whitespace-nowrap rounded-sm bg-white/15 px-2 py-1 text-xs font-bold ring-1 ring-white/25">
              Tài khoản chính
            </span>
          </div>
          <div className="ml-auto hidden h-11 w-full min-w-[120px] max-w-[320px] shrink items-center rounded-sm bg-white/10 px-4 ring-1 ring-white/10 lg:flex xl:max-w-[520px]">
            <span className="mr-2 flex-1 truncate text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5 shrink-0" />
          </div>
          <Link
            href="/host/list"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold ring-1 ring-white/25 lg:flex"
            aria-label="Danh sách chỗ nghỉ"
          >
            ★
          </Link>
          <Link
            href="/settings"
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap font-semibold lg:inline-flex"
          >
            <Globe2 className="h-5 w-5 shrink-0" />
            Tiếng Việt
          </Link>
          <Link
            href="/help"
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap font-semibold lg:inline-flex"
          >
            <CircleHelp className="h-5 w-5 shrink-0" />
            Trợ giúp
          </Link>
          <Bell className="h-6 w-6 shrink-0" />
          <HostAccountMenu userName={userName} />
        </div>

        {!hideNav ? (
          <nav className="mx-auto flex max-w-[1400px] flex-wrap items-end overflow-visible px-6">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`whitespace-nowrap px-4 py-5 text-[15px] font-medium transition ${
                  active === item.key ? "bg-white/12 text-white" : "text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="group relative inline-flex items-center text-white">
              <button
                type="button"
                className={`inline-flex items-center gap-1 whitespace-nowrap px-4 py-5 text-[15px] font-medium transition-colors hover:bg-white/10 ${
                  active === "market-data" ? "bg-white/12 text-white" : "text-white"
                }`}
              >
                Khác
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute right-0 top-full z-50 w-48 rounded-sm border border-slate-200 bg-white py-1 text-[#1a1a1a] opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                <Link
                  href="/host/market-data"
                  className={`block px-4 py-3 text-[14px] font-semibold transition hover:bg-slate-50 ${
                    active === "market-data" ? "text-[#f60057]" : "text-slate-800"
                  }`}
                >
                  Dữ liệu thị trường
                </Link>
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      {children}
    </div>
  );
}
