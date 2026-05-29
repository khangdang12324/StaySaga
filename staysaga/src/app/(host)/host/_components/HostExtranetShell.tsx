"use client";

import Link from "next/link";
import { type ReactNode, useState, useEffect } from "react";
import { Bell, ChevronDown, CircleHelp, Globe2, Search } from "lucide-react";
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
  const [property, setProperty] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchFirstProperty = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const { data } = await supabase
        .from("homestays")
        .select("id, name")
        .eq("owner_id", session.user.id)
        .neq("status", "DELETED")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setProperty({
          id: data[0].id.slice(0, 8),
          name: data[0].name || "Chỗ nghỉ chưa đặt tên"
        });
      }
    };
    fetchFirstProperty();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#1a1a1a]">
      <header className="bg-[#f60057] text-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-5 px-6">
          <Link href="/host" className="shrink-0 text-3xl font-bold tracking-tight hover:opacity-90 transition">
            StaySaga
          </Link>
          {property && (
            <>
              <div className="hidden h-8 w-px shrink-0 bg-white/40 lg:block" />
              <div className="hidden items-center gap-2 text-sm font-bold text-white lg:flex bg-white/10 px-3 py-1.5 rounded-sm ring-1 ring-white/20 select-none">
                <span className="max-w-[160px] truncate">{property.name}</span>
                <span className="bg-white/20 text-[10.5px] px-1.5 py-0.5 rounded text-white/90 font-mono tracking-wider">{property.id}</span>
              </div>
            </>
          )}

          {/* Search bar middle (Booking.com style) */}
          <div className="relative ml-auto hidden w-full max-w-[240px] lg:block xl:max-w-[320px]">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="h-10 w-full rounded bg-white text-slate-800 placeholder-slate-400 pl-4 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#d9004c] border-none"
            />
            <Search className="absolute right-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          </div>

          {/* Right side helper items */}
          <div className="hidden items-center justify-center h-9 w-9 shrink-0 rounded-full bg-yellow-400 text-white font-bold ring-2 ring-yellow-300 lg:flex select-none" title="Đối tác ưu tú">
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

        {!hideNav ? <HostTopNav /> : null}
      </header>

      {children}
    </div>
  );
}
