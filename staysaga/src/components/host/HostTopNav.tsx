"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Menu,
  X,
  Home,
  Calendar,
  Percent,
  Bookmark,
  Building2,
  TrendingUp,
  Mail,
  Star,
  Coins,
  BarChart3,
} from "lucide-react";

interface SubMenuItem {
  label: string;
  href: string;
  tag?: string;
}

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ComponentType<any>;
  subItems?: SubMenuItem[];
}

const menuConfig: MenuItem[] = [
  {
    label: "Trang chủ",
    href: "/host",
    icon: Home,
  },
  {
    label: "Giá & Tình trạng phòng trống",
    icon: Calendar,
    subItems: [
      { label: "Lịch", href: "/host/calendar" },
      { label: "Mở/đóng phòng", href: "/host/availability" },
      { label: "Sao chép giá cho các ngày trong tương lai", href: "/host/rates/copy" },
      { label: "Quy tắc giới hạn linh động", href: "/host/rates/restrictions", tag: "Mới" },
      { label: "Đồng bộ hóa lịch", href: "/host/sync" },
      { label: "Tính năng mở phòng trống", href: "/host/rates/open-rooms" },
      { label: "Loại giá", href: "/host/rates" },
      { label: "Dịch vụ giá trị gia tăng", href: "/host/rates/value-added" },
      { label: "Giá theo số lượng khách", href: "/host/rates/per-guest" },
      { label: "Mức giá theo quốc gia", href: "/host/rates/country" },
      { label: "Giá trên điện thoại", href: "/host/rates/mobile" },
    ],
  },
  {
    label: "Chương trình khuyến mãi",
    icon: Percent,
    subItems: [
      { label: "Tạo khuyến mãi", href: "/host/promotions/new" },
      { label: "Danh sách khuyến mãi", href: "/host/promotions" },
      { label: "Khuyến mãi theo mùa", href: "/host/promotions/seasonal" },
      { label: "Ưu đãi mobile", href: "/host/promotions/mobile" },
    ],
  },
  {
    label: "Đặt phòng",
    icon: Bookmark,
    subItems: [
      { label: "Tất cả đặt phòng", href: "/host/bookings" },
      { label: "Đặt phòng sắp tới", href: "/host/bookings/upcoming" },
      { label: "Đặt phòng đã hủy", href: "/host/bookings/cancellations" },
      { label: "Yêu cầu hủy phòng", href: "/host/bookings/cancel-requests" },
      { label: "Tin nhắn theo booking", href: "/host/bookings/messages" },
    ],
  },
  {
    label: "Chỗ nghỉ",
    icon: Building2,
    subItems: [
      { label: "Thông tin chỗ nghỉ", href: "/host/property" },
      { label: "Ảnh chỗ nghỉ", href: "/host/property/photos" },
      { label: "Tiện nghi", href: "/host/property/amenities" },
      { label: "Phòng", href: "/host/property/rooms" },
      { label: "Chính sách", href: "/host/property/policies" },
      { label: "Vị trí bản đồ", href: "/host/property/location" },
      { label: "Yêu cầu xóa/tạm đóng chỗ nghỉ", href: "/host/property/close" },
    ],
  },
  {
    label: "Thúc đẩy hiệu suất",
    icon: TrendingUp,
    subItems: [
      { label: "Cơ hội cải thiện", href: "/host/opportunities" },
      { label: "Chất lượng nội dung", href: "/host/performance/content" },
      { label: "Tối ưu giá", href: "/host/performance/pricing" },
      { label: "Gợi ý tăng hiển thị", href: "/host/performance/visibility" },
    ],
  },
  {
    label: "Hộp thư",
    icon: Mail,
    subItems: [
      { label: "Tin nhắn khách", href: "/host/messages" },
      { label: "Tin nhắn từ StaySaga", href: "/host/inbox/system" },
      { label: "Câu hỏi thường gặp", href: "/host/inbox/faq" },
    ],
  },
  {
    label: "Đánh giá của khách",
    icon: Star,
    subItems: [
      { label: "Tất cả đánh giá", href: "/host/reviews" },
      { label: "Đánh giá chưa phản hồi", href: "/host/reviews/pending" },
      { label: "Thống kê điểm đánh giá", href: "/host/reviews/stats" },
    ],
  },
  {
    label: "Tài chính",
    icon: Coins,
    subItems: [
      { label: "Tổng quan doanh thu", href: "/host/finance" },
      { label: "Thanh toán", href: "/host/finance/payments" },
      { label: "Hóa đơn", href: "/host/finance/invoices" },
      { label: "Lịch sử giao dịch", href: "/host/revenue" },
    ],
  },
  {
    label: "Phân tích",
    icon: BarChart3,
    subItems: [
      { label: "Tổng quan hiệu suất", href: "/host/market-data" },
      { label: "Lượt xem chỗ nghỉ", href: "/host/analytics/views" },
      { label: "Tỷ lệ chuyển đổi", href: "/host/analytics/conversion" },
      { label: "Doanh thu theo thời gian", href: "/host/analytics/revenue" },
      { label: "Thị trường/nguồn khách", href: "/host/analytics/markets" },
    ],
  },
];

export function HostTopNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menus when changing route
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdownIndex(null);
  }, [pathname]);

  const isItemActive = (item: MenuItem) => {
    if (item.href) {
      return pathname === item.href;
    }
    if (item.subItems) {
      return item.subItems.some((sub) => pathname === sub.href);
    }
    return false;
  };

  const handleDropdownClick = (index: number) => {
    setActiveDropdownIndex(activeDropdownIndex === index ? null : index);
  };

  return (
    <div ref={dropdownRef} className="border-t border-white/10 bg-[#f60057] text-white">
      <div className="mx-auto max-w-[1400px] px-6">
        {/* Mobile Header / Toggle */}
        <div className="flex h-12 items-center justify-between lg:hidden">
          <span className="text-sm font-bold">Menu quản trị</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-1 hover:bg-white/10 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:flex-wrap lg:items-end">
          {menuConfig.map((item, index) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex h-16 items-center gap-2 px-4 text-[14px] font-semibold transition-colors hover:bg-white/10 ${
                    active ? "bg-white/15 shadow-[inset_0_-4px_0_#fff]" : ""
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            const isOpen = activeDropdownIndex === index;

            return (
              <div key={item.label} className="relative group/menu">
                <button
                  onClick={() => handleDropdownClick(index)}
                  className={`flex h-16 items-center gap-1.5 px-4 text-[14px] font-semibold transition-colors hover:bg-white/10 focus:outline-none ${
                    active ? "bg-white/15 shadow-[inset_0_-4px_0_#fff]" : ""
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover/menu:rotate-180" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full z-50 hidden min-w-[240px] rounded-sm border border-gray-200 bg-white py-1 text-slate-800 shadow-xl group-hover/menu:block">
                  {item.subItems?.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`flex items-center justify-between px-4 py-2.5 text-[13.5px] font-medium transition hover:bg-slate-50 ${
                          subActive ? "bg-rose-50 font-bold text-[#f60057]" : "text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <span>{sub.label}</span>
                        {sub.tag && (
                          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                            {sub.tag}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/15 py-2 space-y-1">
            {menuConfig.map((item, index) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 ${
                      active ? "bg-white/15" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
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
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="ml-8 border-l border-white/20 pl-2 py-1 space-y-0.5">
                      {item.subItems?.map((sub) => {
                        const subActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`flex items-center justify-between rounded px-3 py-2 text-xs font-medium transition-colors hover:bg-white/10 ${
                              subActive ? "bg-white/10 text-white font-bold" : "text-white/80 hover:text-white"
                            }`}
                          >
                            <span>{sub.label}</span>
                            {sub.tag && (
                              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                {sub.tag}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
