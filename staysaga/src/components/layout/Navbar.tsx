"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  Globe,
  LogOut,
  CalendarCheck,
  Heart,
  Star,
  Home,
  Settings,
  HelpCircle,
  BarChart,
  MapPin,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/core/auth/actions";
import SafeImage from "@/components/ui/SafeImage";
import { getUserRole, type AppRole } from "@/lib/auth/roles";

// Vietnamese Cities Data
const vietnameseCities = {
  centrallyGoverned: [
    { name: "Hà Nội", slug: "ha-noi", region: "Miền Bắc" },
    { name: "Thành phố Hồ Chí Minh", slug: "ho-chi-minh", region: "Miền Nam" },
    { name: "Hải Phòng", slug: "hai-phong", region: "Miền Bắc" },
    { name: "Đà Nẵng", slug: "da-nang", region: "Miền Trung" },
    { name: "Cần Thơ", slug: "can-tho", region: "Miền Nam" },
    { name: "Huế", slug: "hue", region: "Miền Trung" },
    { name: "Đồng Nai", slug: "dong-nai", region: "Miền Nam" },
  ],
  provincial: {
    "An Giang": ["Long Xuyên", "Châu Đốc"],
    "Bà Rịa - Vũng Tàu": ["Vũng Tàu", "Bà Rịa"],
    "Bắc Giang": ["Bắc Giang"],
    "Bắc Kạn": ["Bắc Kạn"],
    "Bạc Liêu": ["Bạc Liêu"],
    "Bắc Ninh": ["Bắc Ninh", "Từ Sơn"],
    "Bến Tre": ["Bến Tre"],
    "Bình Định": ["Quy Nhơn"],
    "Bình Dương": ["Thủ Dầu Một", "Thuận An", "Dĩ An", "Tân Uyên"],
    "Bình Phước": ["Đồng Xoài"],
    "Bình Thuận": ["Phan Thiết"],
    "Cà Mau": ["Cà Mau"],
    "Cao Bằng": ["Cao Bằng"],
    "Đắk Lắk": ["Buôn Ma Thuột"],
    "Đắk Nông": ["Gia Nghĩa"],
    "Điện Biên": ["Điện Biên Phủ"],
    "Đồng Nai": ["Biên Hòa", "Long Khánh"],
    "Đồng Tháp": ["Cao Lãnh", "Sa Đéc", "Hồng Ngự"],
    "Gia Lai": ["Pleiku"],
    "Hà Giang": ["Hà Giang"],
    "Hà Nam": ["Phủ Lý"],
    "Hà Tĩnh": ["Hà Tĩnh"],
    "Hải Dương": ["Hải Dương"],
    "Hậu Giang": ["Vị Thanh", "Ngã Bảy"],
    "Hòa Bình": ["Hòa Bình"],
    "Hưng Yên": ["Hưng Yên"],
    "Khánh Hòa": ["Nha Trang", "Cam Ranh"],
    "Kiên Giang": ["Rạch Giá", "Hà Tiên", "Phú Quốc"],
    "Kon Tum": ["Kon Tum"],
    "Lai Châu": ["Lai Châu"],
    "Lâm Đồng": ["Đà Lạt", "Bảo Lộc"],
    "Lạng Sơn": ["Lạng Sơn"],
    "Lào Cai": ["Lào Cai"],
    "Long An": ["Tân An"],
    "Nam Định": ["Nam Định"],
    "Nghệ An": ["Vinh"],
    "Ninh Bình": ["Ninh Bình", "Tam Điệp"],
    "Ninh Thuận": ["Phan Rang - Tháp Chàm"],
    "Phú Thọ": ["Việt Trì"],
    "Phú Yên": ["Tuy Hòa"],
    "Quảng Bình": ["Đồng Hới"],
    "Quảng Nam": ["Tam Kỳ", "Hội An"],
    "Quảng Ngãi": ["Quảng Ngãi"],
    "Quảng Ninh": ["Hạ Long", "Móng Cái", "Uông Bí", "Cẩm Phả"],
    "Quảng Trị": ["Đông Hà"],
    "Sóc Trăng": ["Sóc Trăng"],
    "Sơn La": ["Sơn La"],
    "Tây Ninh": ["Tây Ninh"],
    "Thái Bình": ["Thái Bình"],
    "Thái Nguyên": ["Thái Nguyên", "Sông Công"],
    "Thanh Hóa": ["Thanh Hóa", "Sầm Sơn"],
    "Thừa Thiên Huế": ["Hương Thủy", "Hương Trà"],
    "Tiền Giang": ["Mỹ Tho", "Gò Công"],
    "Trà Vinh": ["Trà Vinh"],
    "Tuyên Quang": ["Tuyên Quang"],
    "Vĩnh Long": ["Vĩnh Long"],
    "Vĩnh Phúc": ["Vĩnh Yên", "Phúc Yên"],
    "Yên Bái": ["Yên Bái"],
  },
};

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<AppRole>("guest");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const loadUserRole = async (userId?: string) => {
      if (!userId) {
        setUserRole("guest");
        return;
      }

      const role = await getUserRole(supabase as any, userId);
      setUserRole(role);
    };

    // Check auth session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      await loadUserRole(session?.user?.id);
    };
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        await loadUserRole(session?.user?.id);
      },
    );

    // Click outside to close dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target as Node)
      ) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const userAvatar = user?.user_metadata?.avatar_url || null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          "bg-white py-4 shadow-sm",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-gray-900 transition-colors">
                StaySaga<span className="text-rose-500">.</span>
              </span>
            </Link>

            {/* City Selector */}
            <div className="hidden lg:flex items-center flex-1 justify-center">
              <div className="relative" ref={cityDropdownRef}>
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all border shadow-sm hover:shadow-md bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {selectedCity || "Chọn thành phố"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {cityDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50 max-h-[600px] flex flex-col"
                    >
                      {/* Search Input */}
                      <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Tìm kiếm thành phố..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Cities List */}
                      <div className="flex-1 overflow-y-auto p-2">
                        {/* Centrally Governed Cities */}
                        <div className="mb-4">
                          <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Thành phố trực thuộc Trung ương
                          </h3>
                          {vietnameseCities.centrallyGoverned
                            .filter((city) =>
                              city.name
                                .toLowerCase()
                                .includes(citySearch.toLowerCase()),
                            )
                            .map((city) => (
                              <button
                                key={city.slug}
                                onClick={() => {
                                  setSelectedCity(city.name);
                                  setCityDropdownOpen(false);
                                  setCitySearch("");
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <MapPin className="w-4 h-4 text-rose-500" />
                                <span>{city.name}</span>
                                <span className="text-xs text-gray-400 ml-auto">
                                  {city.region}
                                </span>
                              </button>
                            ))}
                        </div>

                        {/* Provincial Cities */}
                        <div>
                          <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Thành phố trực thuộc tỉnh
                          </h3>
                          {Object.entries(vietnameseCities.provincial).map(
                            ([province, cities]) => {
                              const filteredCities = cities.filter(
                                (city) =>
                                  city
                                    .toLowerCase()
                                    .includes(citySearch.toLowerCase()) ||
                                  province
                                    .toLowerCase()
                                    .includes(citySearch.toLowerCase()),
                              );
                              if (filteredCities.length === 0) return null;

                              return (
                                <div key={province} className="mb-2">
                                  <div className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 rounded">
                                    {province}
                                  </div>
                                  {filteredCities.map((city) => (
                                    <button
                                      key={`${province}-${city}`}
                                      onClick={() => {
                                        setSelectedCity(city);
                                        setCityDropdownOpen(false);
                                        setCitySearch("");
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                      <MapPin className="w-4 h-4 text-rose-500" />
                                      <span>{city}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/destinations"
                className={cn(
                  "font-medium transition-colors hover:text-rose-500 text-gray-700",
                )}
              >
                Điểm đến
              </Link>
              <Link
                href="/homestays"
                className={cn(
                  "font-medium transition-colors hover:text-rose-500 text-gray-700",
                )}
              >
                Homestays
              </Link>
              <Link
                href="/blog"
                className={cn(
                  "font-medium transition-colors hover:text-rose-500 text-gray-700",
                )}
              >
                Trải nghiệm
              </Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Host quick-link: guests -> login (next=/host), hosts -> /host */}
              <Link
                href={user ? "/host" : "/login?next=/host"}
                className={cn(
                  "px-4 py-2 rounded-full font-medium transition-all border",
                  user ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-rose-600 text-white hover:bg-rose-700",
                )}
              >
                <Home className="w-4 h-4 inline-block mr-2" />
                <span className="hidden sm:inline">Trở thành host</span>
              </Link>
              <button
                className={cn(
                  "p-2 rounded-full transition-colors hover:bg-black/5",
                  "text-gray-700",
                )}
              >
                <Globe className="w-5 h-5" />
              </button>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      "flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md border",
                      "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {userAvatar ? (
                      <SafeImage
                        src={userAvatar}
                        alt={userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                        {userName[0].toUpperCase()}
                      </div>
                    )}
                    <Menu className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
                      >
                        {/* User Info Header */}
                        <div className="px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                          <div className="flex items-center gap-3">
                            {userAvatar ? (
                              <SafeImage
                                src={userAvatar}
                                alt={userName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                                {userName[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {userName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <User className="w-4 h-4 text-gray-400" />
                            <span>Tài khoản của tôi</span>
                          </Link>
                          <Link
                            href="/bookings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <CalendarCheck className="w-4 h-4 text-gray-400" />
                            <span>Đặt phòng & Chuyến đi</span>
                          </Link>
                          <Link
                            href="/favorites"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-gray-400" />
                            <span>Đã lưu</span>
                          </Link>
                          <Link
                            href="/reviews"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Star className="w-4 h-4 text-gray-400" />
                            <span>Đánh giá của tôi</span>
                          </Link>
                        </div>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        <div className="py-2">
                          {(userRole === "host" || userRole === "admin") && (
                            <Link
                              href="/host"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Home className="w-4 h-4 text-gray-400" />
                              <span>Quản lý chỗ ở (Host)</span>
                            </Link>
                          )}
                          {userRole === "admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <BarChart className="w-4 h-4 text-gray-400" />
                              <span>Quản trị website</span>
                            </Link>
                          )}
                          <Link
                            href="/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-400" />
                            <span>Cài đặt</span>
                          </Link>
                          <Link
                            href="/help"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                            <span>Trợ giúp</span>
                          </Link>
                        </div>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        <div className="py-2">
                          <form action={logout}>
                            <button
                              type="submit"
                              onClick={() => setDropdownOpen(false)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors font-medium"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Đăng xuất</span>
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all shadow-sm hover:shadow-md bg-rose-600 text-white hover:bg-rose-700"
                >
                  <User className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={cn("p-2 rounded-full text-gray-700")}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-2xl font-black text-rose-600">
                StaySaga.
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Info */}
            {user && (
              <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  {userAvatar ? (
                    <SafeImage
                      src={userAvatar}
                      alt={userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-lg">
                      {userName[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {userName}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-4 px-6 flex flex-col gap-1">
              <Link
                href="/destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg font-medium"
              >
                <Globe className="w-5 h-5 text-gray-400" /> Điểm đến
              </Link>
              <Link
                href="/homestays"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg font-medium"
              >
                <Home className="w-5 h-5 text-gray-400" /> Homestays
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg font-medium"
              >
                <Star className="w-5 h-5 text-gray-400" /> Trải nghiệm
              </Link>

              {user && (
                <>
                  <hr className="my-3 border-gray-100 dark:border-zinc-800" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <User className="w-5 h-5 text-gray-400" /> Tài khoản
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <CalendarCheck className="w-5 h-5 text-gray-400" /> Đặt
                    phòng & Chuyến đi
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <Heart className="w-5 h-5 text-gray-400" /> Đã lưu
                  </Link>
                  <Link
                    href="/reviews"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <Star className="w-5 h-5 text-gray-400" /> Đánh giá
                  </Link>
                  {(userRole === "host" || userRole === "admin") && (
                    <Link
                      href="/host"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-lg font-medium"
                    >
                      <Home className="w-5 h-5 text-gray-400" /> Quản lý chỗ ở
                    </Link>
                  )}
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-lg font-medium"
                    >
                      <BarChart className="w-5 h-5 text-gray-400" /> Quản trị
                      website
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-zinc-800">
              {user ? (
                <form action={logout}>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex justify-center items-center gap-2 bg-gray-100 text-rose-600 dark:bg-zinc-800 py-4 rounded-xl font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Đăng xuất
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex justify-center items-center gap-2 bg-rose-600 text-white py-4 rounded-xl font-medium shadow-md"
                >
                  <User className="w-5 h-5" />
                  Đăng nhập / Đăng ký
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
