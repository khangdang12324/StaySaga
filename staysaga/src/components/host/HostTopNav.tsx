"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bookmark,
  Building2,
  Calendar,
  ChevronDown,
  Coins,
  Home,
  Mail,
  Menu,
  Percent,
  Star,
  TrendingUp,
  X,
} from "lucide-react";

interface SubMenuItem {
  label: string;
  href: string;
  tag?: string;
}

interface MenuGroup {
  header?: string;
  items: SubMenuItem[];
}

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  groups?: MenuGroup[];
}

const menuConfig: MenuItem[] = [
  { label: "Trang chủ", href: "/host", icon: Home, badge: 2 },
  {
    label: "Giá & Tình trạng phòng trống",
    icon: Calendar,
    groups: [
      {
        header: "TÌNH TRẠNG PHÒNG TRỐNG",
        items: [
          { label: "Lịch", href: "/host/calendar" },
          { label: "Mở/đóng phòng", href: "/host/availability" },
          { label: "Sao chép giá cho các ngày trong tương lai", href: "/host/rates/copy" },
          { label: "Quy tắc giới hạn linh động", href: "/host/rates/restrictions", tag: "Mới" },
          { label: "Đồng bộ hóa lịch", href: "/host/sync" },
          { label: "Tính năng mở phòng trống", href: "/host/rates/open-rooms" },
        ],
      },
      {
        header: "GIÁ",
        items: [
          { label: "Loại giá", href: "/host/rates" },
          { label: "Dịch vụ giá trị gia tăng", href: "/host/rates/value-added" },
          { label: "Giá theo số lượng khách", href: "/host/rates/per-guest" },
        ],
      },
      {
        header: "NHẮM MỤC TIÊU",
        items: [
          { label: "Mức giá theo quốc gia", href: "/host/rates/country" },
          { label: "Giá trên điện thoại", href: "/host/rates/mobile" },
        ],
      },
    ],
  },
  {
    label: "Chương trình khuyến mãi",
    icon: Percent,
    groups: [
      {
        header: "TÙY CHỌN KHUYẾN MÃI",
        items: [
          { label: "Tạo khuyến mãi", href: "/host/promotions/new" },
          { label: "Danh sách khuyến mãi", href: "/host/promotions" },
          { label: "Khuyến mãi theo mùa", href: "/host/promotions/seasonal" },
          { label: "Ưu đãi mobile", href: "/host/promotions/mobile" },
        ],
      },
    ],
  },
  {
    label: "Đặt phòng",
    icon: Bookmark,
    groups: [
      {
        header: "QUẢN LÝ ĐẶT PHÒNG",
        items: [
          { label: "Tất cả đặt phòng", href: "/host/bookings" },
          { label: "Đặt phòng sắp tới", href: "/host/bookings/upcoming" },
          { label: "Đặt phòng đã hủy", href: "/host/bookings/cancellations" },
          { label: "Yêu cầu hủy phòng", href: "/host/bookings/cancel-requests" },
          { label: "Tin nhắn theo booking", href: "/host/bookings/messages" },
        ],
      },
    ],
  },
  {
    label: "Chỗ nghỉ",
    icon: Building2,
    badge: 1,
    groups: [
      {
        header: "CHI TIẾT CHỖ NGHỈ",
        items: [
          { label: "Thông tin chỗ nghỉ", href: "/host/property" },
          { label: "Ảnh chỗ nghỉ", href: "/host/property/photos" },
          { label: "Tiện nghi", href: "/host/property/amenities" },
          { label: "Phòng", href: "/host/property/rooms" },
          { label: "Chính sách", href: "/host/property/policies" },
          { label: "Vị trí bản đồ", href: "/host/property/location" },
          { label: "Yêu cầu xóa/tạm đóng chỗ nghỉ", href: "/host/property/close" },
        ],
      },
    ],
  },
  {
    label: "Thúc đẩy hiệu suất",
    icon: TrendingUp,
    badge: 20,
    groups: [
      {
        header: "TỐI ƯU HÓA HIỆU SUẤT",
        items: [
          { label: "Cơ hội cải thiện", href: "/host/opportunities" },
          { label: "Chất lượng nội dung", href: "/host/performance/content" },
          { label: "Tối ưu giá", href: "/host/performance/pricing" },
          { label: "Gợi ý tăng hiển thị", href: "/host/performance/visibility" },
        ],
      },
    ],
  },
  {
    label: "Hộp thư",
    icon: Mail,
    badge: 4,
    groups: [
      {
        header: "HỘP THƯ TƯƠNG TÁC",
        items: [
          { label: "Tin nhắn khách", href: "/host/messages" },
          { label: "Tin nhắn từ StaySaga", href: "/host/inbox/system" },
          { label: "Câu hỏi thường gặp", href: "/host/inbox/faq" },
        ],
      },
    ],
  },
  {
    label: "Đánh giá của khách",
    icon: Star,
    groups: [
      {
        header: "PHẢN HỒI & ĐÁNH GIÁ",
        items: [
          { label: "Tất cả đánh giá", href: "/host/reviews" },
          { label: "Đánh giá chưa phản hồi", href: "/host/reviews/pending" },
          { label: "Thống kê điểm đánh giá", href: "/host/reviews/stats" },
        ],
      },
    ],
  },
  {
    label: "Tài chính",
    icon: Coins,
    groups: [
      {
        header: "BÁO CÁO TÀI CHÍNH",
        items: [
          { label: "Tổng quan doanh thu", href: "/host/finance" },
          { label: "Thanh toán", href: "/host/finance/payments" },
          { label: "Hóa đơn", href: "/host/finance/invoices" },
          { label: "Lịch sử giao dịch", href: "/host/revenue" },
        ],
      },
    ],
  },
  {
    label: "Phân tích",
    icon: BarChart3,
    groups: [
      {
        header: "SỐ LIỆU PHÂN TÍCH",
        items: [
          { label: "Tổng quan hiệu suất", href: "/host/market-data" },
          { label: "Lượt xem chỗ nghỉ", href: "/host/analytics/views" },
          { label: "Tỷ lệ chuyển đổi", href: "/host/analytics/conversion" },
          { label: "Doanh thu theo thời gian", href: "/host/analytics/revenue" },
          { label: "Thị trường/nguồn khách", href: "/host/analytics/markets" },
        ],
      },
    ],
  },
];

function isRouteActive(pathname: string, href: string) {
  if (pathname === href) return true;

  if (href === "/host/calendar") {
    return /^\/host\/[^/]+\/calendar(\/|$)/.test(pathname);
  }

  if (href === "/host/rates") {
    return pathname === "/host/rates" || /^\/host\/[^/]+\/calendar\/rate-plans(\/|$)/.test(pathname);
  }

  if (href === "/host/sync") {
    return pathname === "/host/sync" || /^\/host\/[^/]+\/sync(\/|$)/.test(pathname);
  }

  return pathname.startsWith(`${href}/`);
}

export function HostTopNav() {
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isItemActive = (item: MenuItem) => {
    if (item.href) return isRouteActive(pathname, item.href);
    return item.groups?.some((group) => group.items.some((sub) => isRouteActive(pathname, sub.href))) ?? false;
  };

  const handleDropdownClick = (index: number) => {
    setActiveDropdownIndex((current) => (current === index ? null : index));
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setActiveDropdownIndex(null);
  };

  return (
    <div ref={dropdownRef} className="border-t border-white/15 bg-[#f60057] text-white">
      <div className="w-full">
        <div className="flex h-12 items-center justify-between px-4 lg:hidden">
          <span className="text-sm font-bold">Menu quản trị</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-1 hover:bg-white/10 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <nav className="hidden h-[104px] min-w-0 lg:flex lg:flex-nowrap lg:items-stretch">
          {menuConfig.map((item, index) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            const isOpen = activeDropdownIndex === index;
            const triggerButtonContent = (
              <>
                <span className="relative flex h-9 items-center justify-center">
                  <Icon className="h-8 w-8 stroke-[1.8]" />
                  {item.badge ? (
                    <span className="absolute -right-3 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-[#f60057] shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="flex min-w-0 max-w-[190px] items-center justify-center gap-1 text-balance text-center text-[13px] font-bold leading-tight xl:text-[15px]">
                  {item.label}
                  {item.groups ? <ChevronDown className={`h-4 w-4 shrink-0 opacity-90 transition-transform ${isOpen ? "rotate-180" : ""}`} /> : null}
                </span>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenus}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-2 px-2 text-center text-white/95 transition-colors hover:bg-white/10 select-none xl:px-4 ${
                    active ? "bg-white/15 shadow-[inset_0_-4px_0_#fff] text-white" : ""
                  }`}
                >
                  {triggerButtonContent}
                </Link>
              );
            }

            return (
              <div key={item.label} className="relative flex min-w-0 flex-1 group/menu">
                <button
                  onClick={() => handleDropdownClick(index)}
                  className={`flex w-full min-w-0 flex-col items-center justify-center gap-2 px-2 text-center text-white/95 transition-colors hover:bg-white/10 focus:outline-none cursor-pointer select-none xl:px-4 ${
                    active || isOpen ? "bg-white/15 shadow-[inset_0_-4px_0_#fff] text-white" : ""
                  }`}
                  aria-expanded={isOpen}
                >
                  {triggerButtonContent}
                </button>

                <div
                  className={`absolute left-0 top-full z-50 min-w-[374px] max-w-[374px] border border-slate-200 bg-white py-4 text-slate-800 shadow-2xl transition ${
                    isOpen ? "block" : "hidden group-hover/menu:block"
                  }`}
                >
                  {item.groups?.map((group, gIdx) => (
                    <div key={group.header ?? gIdx} className={gIdx > 0 ? "mt-4 border-t border-slate-200 pt-3" : ""}>
                      {group.header ? (
                        <div className="px-5 pb-1 text-[13px] font-black uppercase tracking-wide text-slate-400 select-none">
                          {group.header}
                        </div>
                      ) : null}
                      <div>
                        {group.items.map((sub) => {
                          const subActive = isRouteActive(pathname, sub.href);
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={closeMenus}
                              className={`flex min-h-11 items-center justify-between gap-4 px-5 py-2.5 text-[16px] font-normal leading-snug transition ${
                                subActive ? "bg-rose-50 text-[#f60057]" : "text-slate-800 hover:bg-slate-50 hover:text-[#f60057]"
                              }`}
                            >
                              <span>{sub.label}</span>
                              {sub.tag ? (
                                <span className="shrink-0 rounded-[3px] bg-[#008009] px-2 py-1 text-[12px] font-black leading-none text-white">
                                  {sub.tag}
                                </span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {mobileMenuOpen ? (
          <div className="lg:hidden border-t border-white/15 px-4 py-2 space-y-1">
            {menuConfig.map((item, index) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenus}
                    className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 ${
                      active ? "bg-white/15" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#f60057]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              }

              const isOpen = activeDropdownIndex === index;

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => handleDropdownClick(index)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 focus:outline-none ${
                      active ? "bg-white/15" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.badge ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#f60057]">
                          {item.badge}
                        </span>
                      ) : null}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="ml-8 border-l border-white/20 pl-2 py-1 space-y-2">
                      {item.groups?.map((group, gIdx) => (
                        <div key={group.header ?? gIdx} className="space-y-1">
                          {group.header ? (
                            <div className="px-3 text-[10px] font-black tracking-wider text-white/60">
                              {group.header}
                            </div>
                          ) : null}
                          <div className="space-y-0.5">
                            {group.items.map((sub) => {
                              const subActive = isRouteActive(pathname, sub.href);
                              return (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  onClick={closeMenus}
                                  className={`flex items-center justify-between gap-3 rounded px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10 ${
                                    subActive ? "bg-white/10 text-white font-bold" : "text-white/85 hover:text-white"
                                  }`}
                                >
                                  <span>{sub.label}</span>
                                  {sub.tag ? (
                                    <span className="rounded bg-[#008009] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                      {sub.tag}
                                    </span>
                                  ) : null}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
