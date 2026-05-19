"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";
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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/core/auth/actions";
import SafeImage from "@/components/ui/SafeImage";
import {
  canAccessAdmin,
  canAccessPartner,
  getUserRole,
  type AppRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { useRouter } from "next/navigation";

type OAuthIdentity = {
  provider?: string;
  identity_data?: {
    avatar_url?: string;
    picture?: string;
  };
};

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<AppRole>("USER");
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  const [currency, setCurrency] = useState("VND");
  const [lang, setLang] = useState("VN");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);



  useEffect(() => {
    // Read from cookies
    if (typeof document !== 'undefined') {
       const cookies = document.cookie.split(';');
       let foundCurrency = "VND";
       let foundLang = "VN";
       for (const cookie of cookies) {
          const [key, value] = cookie.trim().split('=');
          if (key === 'currency') foundCurrency = value;
          if (key === 'lang') foundLang = value;
       }
       setCurrency(foundCurrency);
       setLang(foundLang);

       if (foundLang === "EN") {
          if (!document.getElementById("google-translate-script")) {
             const script = document.createElement("script");
             script.id = "google-translate-script";
             script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
             script.async = true;
             document.body.appendChild(script);
             const style = document.createElement("style");
             style.innerHTML = "body { top: 0 !important; } .skiptranslate > iframe.skiptranslate { display: none !important; visibility: hidden !important; } #goog-gt-tt { display: none !important; }";
             document.head.appendChild(style);

             (window as any).googleTranslateElementInit = () => {
               new (window as any).google.translate.TranslateElement(
                 { pageLanguage: 'vi', includedLanguages: 'en', autoDisplay: false },
                 'google_translate_element'
               );
               setTimeout(() => {
                  const select = document.querySelector('select.goog-te-combo') as HTMLSelectElement;
                  if (select) {
                     select.value = 'en';
                     select.dispatchEvent(new Event('change'));
                  }
               }, 500);
             };
          }
       }
    }

    const loadUserRole = async (userId?: string) => {
      if (!userId) {
        setUserRole("USER");
        return;
      }
      const role = await getUserRole(supabase as unknown as SupabaseLike, userId);
      setUserRole(role);
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      await loadUserRole(session?.user?.id);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user || null);
        await loadUserRole(session?.user?.id);
      },
    );

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleHotelsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.county || data.address.state || "Đà Lạt";
            router.push(`/homestays?location=${encodeURIComponent(city)}`);
          } catch (error) {
            router.push("/homestays");
          }
        },
        () => {
          router.push("/homestays");
        }
      );
    } else {
      router.push("/homestays");
    }
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const identities = (user?.identities || []) as OAuthIdentity[];
  const googleIdentity = identities.find((identity) => identity.provider === "google");
  const facebookIdentity = identities.find((identity) => identity.provider === "facebook");
  const oauthAvatar = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || googleIdentity?.identity_data?.picture || facebookIdentity?.identity_data?.avatar_url || facebookIdentity?.identity_data?.picture || null;
  const userAvatar = typeof oauthAvatar === "string" && oauthAvatar.startsWith("http") ? oauthAvatar : null;

  const t = (vi: string, en: string) => lang === "EN" ? en : vi;

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/host")) {
    return null;
  }

  if (pathname === "/login" || pathname === "/register") {
    return (
      <header className="bg-[#f60057] text-white w-full">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            StaySaga<span className="text-rose-200">.</span>
          </Link>
          <Link href="/help" className="text-sm font-semibold hover:text-rose-200 transition-colors">
            Trợ giúp
          </Link>
        </div>
      </header>
    );
  }

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }}></div>
      <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
            "bg-gradient-to-r from-pink-600 to-rose-500 text-white py-4 shadow-lg",
          )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-8">
                <span className="text-2xl font-black tracking-tighter text-white transition-colors">
                  StaySaga<span className="text-rose-300">.</span>
                </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 mr-auto">
                <Link
                  href="/destinations"
                  className={cn("font-medium transition-colors hover:text-rose-100 text-white")}
                >
                  {t("Điểm đến", "Destinations")}
                </Link>
                <button
                  onClick={handleHotelsClick}
                  className={cn("font-medium transition-colors hover:text-rose-100 text-white cursor-pointer")}
                >
                  StaySaga Hotels
                </button>
                <Link
                  href="/blog"
                  className={cn("font-medium transition-colors hover:text-rose-100 text-white")}
                >
                  {t("Trải nghiệm", "Experiences")}
                </Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-2 flex-none">
              
              {/* Currency Selector */}
              <div className="relative" ref={currencyRef}>
                <button
                  onClick={() => setCurrencyOpen(!currencyOpen)}
                  className="px-3 py-2 rounded-full font-bold transition-colors hover:bg-white/10 text-white flex items-center gap-1 notranslate translate-no"
                >
                  {currency}
                </button>
                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      <button 
                         onClick={() => { setCurrency("VND"); document.cookie = "currency=VND; path=/; max-age=31536000"; setCurrencyOpen(false); window.location.reload(); }}
                         className={`notranslate translate-no w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${currency === "VND" ? "text-rose-600 font-bold bg-rose-50" : "text-gray-700"}`}
                      >
                         VND
                      </button>
                      <button 
                         onClick={() => { setCurrency("USD"); document.cookie = "currency=USD; path=/; max-age=31536000"; setCurrencyOpen(false); window.location.reload(); }}
                         className={`notranslate translate-no w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${currency === "USD" ? "text-rose-600 font-bold bg-rose-50" : "text-gray-700"}`}
                      >
                         USD
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Selector */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="p-2 rounded-full transition-colors hover:bg-white/10 text-white flex items-center justify-center"
                >
                  {lang === "VN" ? (
                    <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border border-red-700">
                       <span className="text-yellow-400 text-[10px] leading-none">★</span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center border border-blue-900 overflow-hidden relative">
                       <div className="absolute w-full h-1 bg-red-600 top-1/2 -translate-y-1/2 z-10" />
                       <div className="absolute h-full w-1 bg-red-600 left-1/2 -translate-x-1/2 z-10" />
                       <div className="absolute w-full h-2 bg-white top-1/2 -translate-y-1/2 z-0" />
                       <div className="absolute h-full w-2 bg-white left-1/2 -translate-x-1/2 z-0" />
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      <button 
                         onClick={() => { setLang("VN"); document.cookie = "lang=VN; path=/; max-age=31536000"; setLangOpen(false); window.location.reload(); }}
                         className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${lang === "VN" ? "text-rose-600 font-bold bg-rose-50" : "text-gray-700"}`}
                      >
                         <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center border border-red-700 shrink-0">
                            <span className="text-yellow-400 text-[10px] leading-none">★</span>
                         </div>
                         Tiếng Việt
                      </button>
                      <button 
                         onClick={() => { setLang("EN"); document.cookie = "lang=EN; path=/; max-age=31536000"; setLangOpen(false); window.location.reload(); }}
                         className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${lang === "EN" ? "text-rose-600 font-bold bg-rose-50" : "text-gray-700"}`}
                      >
                         <div className="w-5 h-5 rounded-full bg-blue-800 flex items-center justify-center border border-blue-900 overflow-hidden relative shrink-0">
                            <div className="absolute w-full h-1 bg-red-600 top-1/2 -translate-y-1/2 z-10" />
                            <div className="absolute h-full w-1 bg-red-600 left-1/2 -translate-x-1/2 z-10" />
                            <div className="absolute w-full h-2 bg-white top-1/2 -translate-y-1/2 z-0" />
                            <div className="absolute h-full w-2 bg-white left-1/2 -translate-x-1/2 z-0" />
                         </div>
                         English
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Help Link */}
              <Link href="/help" className="p-2 text-white hover:bg-white/10 rounded-full transition-colors mr-2">
                 <HelpCircle className="w-5 h-5" />
              </Link>

              {/* Host quick-link: Booking-style list page */}
              <Link
                href="/host/list"
                className={cn(
                  "rounded-full px-4 font-semibold transition-all",
                  "bg-white text-rose-600 border border-white/30 flex items-center gap-2 py-1.5 shadow-sm hover:shadow-md hover:bg-rose-50",
                )}
              >
                <span className="hidden sm:inline text-sm">{t("Đăng chỗ nghỉ", "List your property")}</span>
              </Link>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      "flex items-center gap-2 p-1 rounded-full font-medium transition-all shadow-sm hover:shadow-md border",
                      "bg-white border-rose-200 text-gray-700 hover:bg-rose-50 ml-2",
                    )}
                  >
                    {userAvatar ? (
                      <SafeImage
                        src={userAvatar}
                        alt={userName}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#febb02] text-rose-900 flex items-center justify-center font-bold text-xs">
                        {userName[0].toUpperCase()}
                      </div>
                    )}
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
                            <span>{t("Tài khoản của tôi", "My Account")}</span>
                          </Link>
                          <Link
                            href="/bookings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <CalendarCheck className="w-4 h-4 text-gray-400" />
                            <span>{t("Đặt phòng & Chuyến đi", "Bookings & Trips")}</span>
                          </Link>
                          <Link
                            href="/favorites"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-gray-400" />
                            <span>{t("Đã lưu", "Saved")}</span>
                          </Link>
                          <Link
                            href="/reviews"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Star className="w-4 h-4 text-gray-400" />
                            <span>{t("Đánh giá của tôi", "My Reviews")}</span>
                          </Link>
                        </div>

                        <hr className="border-gray-100 dark:border-zinc-800" />

                        <div className="py-2">
                          {canAccessPartner(userRole) && (
                            <Link
                              href="/host"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <Home className="w-4 h-4 text-rose-500" />
                              <span>{t("Quản lý chỗ ở (Host)", "Manage properties (Host)")}</span>
                            </Link>
                          )}
                          {canAccessAdmin(userRole) && (
                            <Link
                              href="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <BarChart className="w-4 h-4 text-rose-500" />
                              <span>{t("Quản trị website", "Admin Dashboard")}</span>
                            </Link>
                          )}
                          <Link
                            href="/settings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                            <span>{t("Cài đặt", "Settings")}</span>
                          </Link>
                          <Link
                            href="/help"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                            <span>{t("Trợ giúp", "Help & Support")}</span>
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
                              <span>{t("Đăng xuất", "Log out")}</span>
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
                  className="flex items-center gap-2 px-4 py-2 ml-2 rounded-full font-medium transition-all shadow-sm hover:shadow-md bg-white text-rose-600 hover:bg-rose-50 text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>{t("Đăng nhập", "Sign in")}</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={cn("p-2 rounded-full text-white")}
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
                <Globe className="w-5 h-5 text-gray-400" /> {t("Điểm đến", "Destinations")}
              </Link>
              <button
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleHotelsClick(e);
                }}
                className="flex items-center gap-3 py-3 text-lg font-medium text-left"
              >
                <MapPin className="w-5 h-5 text-gray-400" /> StaySaga Hotels {t("(Gần tôi)", "(Near me)")}
              </button>
              <Link
                href="/host/list"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg font-medium"
              >
                <Home className="w-5 h-5 text-gray-400" /> {t("Đăng chỗ nghỉ", "List your property")}
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 text-lg font-medium"
              >
                <Star className="w-5 h-5 text-gray-400" /> {t("Trải nghiệm", "Experiences")}
              </Link>

              {user && (
                <>
                  <hr className="my-3 border-gray-100 dark:border-zinc-800" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <User className="w-5 h-5 text-gray-400" /> {t("Tài khoản", "Account")}
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <CalendarCheck className="w-5 h-5 text-gray-400" /> {t("Đặt phòng & Chuyến đi", "Bookings & Trips")}
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <Heart className="w-5 h-5 text-gray-400" /> {t("Đã lưu", "Saved")}
                  </Link>
                  <Link
                    href="/reviews"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 text-lg font-medium"
                  >
                    <Star className="w-5 h-5 text-gray-400" /> {t("Đánh giá", "Reviews")}
                  </Link>
                  {canAccessPartner(userRole) && (
                    <Link
                      href="/host"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-lg font-medium"
                    >
                      <Home className="w-5 h-5 text-gray-400" /> {t("Quản lý chỗ ở", "Manage properties")}
                    </Link>
                  )}
                  {canAccessAdmin(userRole) && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-lg font-medium"
                    >
                      <BarChart className="w-5 h-5 text-gray-400" /> {t("Quản trị website", "Admin Dashboard")}
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
                    {t("Đăng xuất", "Log out")}
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex justify-center items-center gap-2 bg-rose-600 text-white py-4 rounded-xl font-medium shadow-md"
                >
                  <User className="w-5 h-5" />
                  {t("Đăng nhập / Đăng ký", "Sign in / Register")}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
