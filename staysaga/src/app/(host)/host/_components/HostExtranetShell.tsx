import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, ChevronDown, Globe2, Search } from "lucide-react";
import { HostAccountMenu } from "./HostAccountMenu";

type HostNavKey =
  | "home"
  | "bookings"
  | "revenue"
  | "reviews"
  | "finance"
  | "bulk"
  | "opportunities"
  | "market-data";

type HostExtranetShellProps = {
  active: HostNavKey;
  userName: string;
  children: ReactNode;
  hideNav?: boolean;
};

const navItems: { key: HostNavKey; label: string; href: string }[] = [
  { key: "home", label: "Trang chủ Nhóm chỗ nghỉ", href: "/host" },
  { key: "bookings", label: "Đặt phòng", href: "/host/bookings" },
  { key: "revenue", label: "Doanh thu chiến lược", href: "/host/revenue" },
  { key: "reviews", label: "Đánh giá", href: "/host/reviews" },
  { key: "finance", label: "Tài chính", href: "/host/finance" },
  { key: "bulk", label: "Chỉnh sửa đồng loạt", href: "/host/bulk" },
  { key: "opportunities", label: "Trung tâm Cơ hội", href: "/host/opportunities" },
];

export function HostExtranetShell({ active, userName, children, hideNav = false }: HostExtranetShellProps) {
  return (
    <div className="min-h-screen bg-[#f2f2f2] text-slate-950">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-3xl font-black tracking-tight">
            StaySaga<span className="text-white">.</span>
          </Link>
          <span className="h-8 w-px bg-white/35" />
          <div className="hidden items-center gap-3 md:flex">
            <span className="font-semibold">{userName}</span>
            <span className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold">Tài khoản chính</span>
          </div>
          <div className="ml-auto hidden h-12 min-w-[360px] items-center rounded bg-white/10 px-4 md:flex">
            <span className="flex-1 text-white/90">Tìm kiếm</span>
            <Search className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-[#d9004e] px-2 py-1 text-xs font-bold ring-1 ring-white/30">VN</span>
          <Globe2 className="h-6 w-6" />
          <Bell className="h-6 w-6" />
          <HostAccountMenu userName={userName} />
        </div>
        {!hideNav && (
          <nav className="border-t border-white/10 bg-[#f60057]">
            <div className="no-scrollbar mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`whitespace-nowrap px-4 py-4 text-sm font-semibold hover:bg-white/10 ${
                    active === item.key ? "shadow-[inset_0_-4px_0_#fff]" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="group relative">
                <button className="flex items-center gap-1 whitespace-nowrap px-4 py-4 text-sm font-semibold hover:bg-white/10">
                  Khác <ChevronDown className="h-4 w-4" />
                </button>
                <div className="invisible absolute right-0 top-full z-20 min-w-56 pt-1 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="border border-slate-200 bg-white py-2 text-slate-900 shadow-lg">
                    <Link href="/host/market-data" className="block px-5 py-3 text-sm font-semibold hover:bg-rose-50 hover:text-[#f60057]">
                      Dữ liệu thị trường
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}
