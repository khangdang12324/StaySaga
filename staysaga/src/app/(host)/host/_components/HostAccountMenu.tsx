import Link from "next/link";
import {
  Bell,
  ClipboardCheck,
  FileText,
  KeyRound,
  LogOut,
  Network,
  PlusCircle,
  Scale,
  Settings,
  Smartphone,
  UserCircle,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { logout } from "@/core/auth/actions";

type HostAccountMenuProps = {
  userName: string;
};

const menuItems = [
  { icon: <KeyRound className="h-5 w-5" />, label: "Thay đổi mật khẩu", href: "/profile" },
  { icon: <Bell className="h-5 w-5" />, label: "Cài đặt thông báo", href: "/settings" },
  { icon: <ClipboardCheck className="h-5 w-5" />, label: "Cá nhân hóa nội dung", href: "/host/opportunities" },
  { icon: <UserPlus className="h-5 w-5" />, label: "Tạo và quản lý người dùng", href: "/host" },
  { icon: <UsersRound className="h-5 w-5" />, label: "Thông tin liên hệ", href: "/profile" },
  { icon: <Smartphone className="h-5 w-5" />, label: "Các thiết bị của tôi", href: "/settings" },
  { icon: <Network className="h-5 w-5" />, label: "Nhà cung cấp kết nối", href: "/host/bulk" },
  { icon: <FileText className="h-5 w-5" />, label: "Hợp đồng", href: "/host/finance" },
  { icon: <Settings className="h-5 w-5" />, label: "Bảo mật", href: "/settings" },
  { icon: <Scale className="h-5 w-5" />, label: "Trung tâm pháp lý và tuân thủ", href: "/help" },
];

function getInitials(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return "SS";
  if (cleaned.includes("@")) return cleaned.slice(0, 2).toUpperCase();
  return cleaned
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function HostAccountMenu({ userName }: HostAccountMenuProps) {
  return (
    <div className="group relative">
      <button className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-white/80" aria-label="Mở menu tài khoản">
        <UserCircle className="h-9 w-9" />
      </button>
      <div className="invisible absolute right-0 top-full z-50 min-w-[340px] pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="border border-slate-200 bg-white text-slate-950 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
              {getInitials(userName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">{userName}</p>
              <span className="mt-1 inline-flex rounded bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">Đối tác</span>
            </div>
          </div>

          <div className="py-2">
            {menuItems.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center gap-4 px-5 py-3 text-sm font-semibold hover:bg-rose-50 hover:text-[#f60057]">
                <span className="text-slate-500">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <form action={logout} className="border-t border-slate-100">
            <button className="flex w-full items-center gap-4 px-5 py-3 text-left text-sm font-bold text-[#f60057] hover:bg-rose-50">
              <LogOut className="h-5 w-5" />
              Đăng xuất
            </button>
          </form>

          <div className="border-t border-slate-100 px-5 py-4">
            <p className="font-black">Thêm chỗ nghỉ vào tài khoản của bạn</p>
            <Link href="/host/properties/new" className="mt-4 flex items-center gap-4 text-sm font-semibold hover:text-[#f60057]">
              <PlusCircle className="h-6 w-6 text-slate-500" />
              Thêm chỗ nghỉ mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
