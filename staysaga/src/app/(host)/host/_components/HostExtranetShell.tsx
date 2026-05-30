"use client";

import Link from "next/link";
import { type ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, CircleHelp, Search, Menu, X } from "lucide-react";
import { HostAccountMenu } from "./HostAccountMenu";
import { HostTopNav } from "@/components/host/HostTopNav";
import { createClient } from "@/lib/supabase/client";

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

const groupNavItems = [
  { key: "home", label: "Trang chủ Nhóm chỗ nghỉ", href: "/host" },
  { key: "bookings", label: "Đặt phòng", href: "/host/bookings" },
  { key: "revenue", label: "Doanh thu chiến lược", href: "/host/revenue" },
  { key: "reviews", label: "Đánh giá", href: "/host/reviews" },
  { key: "finance", label: "Tài chính", href: "/host/finance" },
  { key: "bulk", label: "Chỉnh sửa đồng loạt", href: "/host/bulk" },
  { key: "opportunities", label: "Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ", href: "/host/opportunities" },
];

export function HostExtranetShell({
  active,
  userName,
  children,
  hideNav = false,
}: HostExtranetShellProps) {
  const pathname = usePathname() || "";
  const [property, setProperty] = useState<{ id: string; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Group Mode vs Property Mode detection
  const isGroup = [
    "/host",
    "/host/bookings",
    "/host/messages",
    "/host/revenue",
    "/host/reviews",
    "/host/finance",
    "/host/bulk",
    "/host/opportunities",
    "/host/market-data",
    "/host/list",
    "/host/onboard",
    "/host/properties/new"
  ].includes(pathname);

  useEffect(() => {
    // We only fetch and set active property if we are NOT in group mode
    if (isGroup) {
      setProperty(null);
      return;
    }

    const supabase = createClient();
    const fetchFirstProperty = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data } = await supabase
        .from("homestays")
        .select("id, name, registration_checklist")
        .eq("owner_id", session.user.id)
        .neq("status", "DELETED")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const placeholderNames = [
          "ChÃ¡Â»â€” nghÃ¡Â»â€° chÃ†Â°a Ã„â€˜Ã¡ÂºÂ·t tÃƒÂªn",
          "Cho nghi chua dat ten",
          "Chá»— nghá»‰ chÆ°a Ä‘áº·t tÃªn",
          "Chỗ nghỉ chưa đặt tên",
        ];
        const rawName = data[0].name?.trim() || "";
        const isPlaceholder = !rawName || placeholderNames.includes(rawName);
        const draftName = (data[0].registration_checklist as any)?.draftState?.name;
        const displayName = (isPlaceholder && draftName && typeof draftName === "string" && draftName.trim())
          ? draftName.trim()
          : (data[0].name || "Chỗ nghỉ chưa đặt tên");

        setProperty({
          id: data[0].id.slice(0, 8),
          name: displayName
        });
      }
    };
    fetchFirstProperty();
  }, [isGroup]);

  // Close mobile menu on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#1a1a1a]">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-[1400px] w-full items-center gap-6 px-6">
          <Link href="/host" className="shrink-0 text-[28px] font-black leading-none tracking-tight hover:opacity-90 transition">
            StaySaga
          </Link>
          
          {isGroup ? (
            // Group Header Label
            <>
              <div className="hidden h-9 w-px shrink-0 bg-white/35 lg:block" />
              <div className="hidden min-w-0 items-center gap-3 text-[15px] font-bold text-white lg:flex select-none">
                <span className="max-w-[180px] truncate font-black leading-tight">{userName}</span>
                <span className="shrink-0 whitespace-nowrap rounded-sm bg-[#008009] px-2 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                  Tài khoản chính
                </span>
              </div>
            </>
          ) : (
            // Property Header Label
            property && (
              <>
                <div className="hidden h-9 w-px shrink-0 bg-white/35 lg:block" />
                <div className="hidden min-w-0 flex-col text-white lg:flex select-none">
                  <span className="max-w-[180px] truncate text-[15px] font-black leading-tight">{property.name}</span>
                  <span className="text-[13px] font-semibold leading-tight text-white/85">ID {property.id}</span>
                </div>
              </>
            )
          )}

          {/* Search bar middle (Booking.com style) */}
          <div className="relative ml-auto hidden h-12 w-full max-w-[540px] flex-1 lg:block">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="h-12 w-full rounded-sm bg-white/10 pl-5 pr-12 text-[15px] font-semibold text-white placeholder-white/90 outline-none ring-1 ring-white/10 transition-colors focus:bg-white focus:text-slate-900 focus:ring-white focus:placeholder-slate-500"
            />
            <Search className="pointer-events-none absolute right-4 top-3.5 h-5 w-5 text-white/90" />
          </div>

          {/* Right side helper items */}
          <div className="hidden items-center justify-center h-9 w-9 shrink-0 rounded-full bg-[#e61212] text-yellow-300 font-black text-lg shadow-sm border border-yellow-300/40 lg:flex select-none animate-pulse" title="Đối tác ưu tú">
            ★
          </div>

          <Link
            href="/help"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/20 lg:flex"
            title="Trợ giúp"
          >
            <CircleHelp className="h-5 w-5 shrink-0" />
          </Link>

          <Bell className="h-6 w-6 shrink-0 cursor-pointer hover:opacity-85" />
          <HostAccountMenu userName={userName} />
        </div>

        {/* Navigation Selector */}
        {!hideNav && (
          isGroup ? (
            // Group Navigation Menu (Booking.com Style)
            <div className="border-t border-white/10 bg-[#f60057]">
              <div className="mx-auto max-w-[1400px]">
                {/* Desktop Menu */}
                <nav className="hidden lg:flex lg:flex-wrap lg:items-end px-6">
                  {groupNavItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`flex items-center justify-center px-4 py-4 text-xs font-black transition-colors select-none ${
                          active
                            ? "bg-white/15 shadow-[inset_0_-4px_0_#fff] text-white"
                            : "text-white/95 hover:bg-white/10"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* Dropdown for "Khác" */}
                  <div className="relative group/khac">
                    <button
                      className={`flex items-center gap-1 px-4 py-4 text-xs font-black text-white/95 transition-colors hover:bg-white/10 focus:outline-none cursor-pointer select-none ${
                        pathname === "/host/market-data" ? "bg-white/15 shadow-[inset_0_-4px_0_#fff] text-white" : ""
                      }`}
                    >
                      Khác
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    </button>
                    <div className="absolute right-0 top-full z-50 hidden min-w-[180px] rounded-sm border border-slate-200 bg-white py-1 text-slate-800 shadow-2xl group-hover/khac:block animate-in fade-in slide-in-from-top-1 duration-150">
                      <Link
                        href="/host/market-data"
                        className={`block px-4 py-2.5 text-[13px] font-semibold transition hover:bg-slate-50 ${
                          pathname === "/host/market-data" ? "bg-rose-50 text-[#f60057] font-black" : "text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        Dữ liệu thị trường
                      </Link>
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          ) : (
            // Property-level Navigation Menu (10 items)
            <HostTopNav propertyId={pathname.match(/^\/host\/([a-f0-9-]+)/)?.[1] || property?.id} />
          )
        )}
      </header>

      {children}
    </div>
  );
}
