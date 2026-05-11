"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  CalendarCheck,
  Heart,
  Star,
  Settings,
  Shield,
  Wallet,
  Bell,
  Plane,
  Globe,
  Award,
  ChevronRight,
  Camera,
  Sparkles,
  TrendingUp,
  Clock,
  Gift,
  MessageCircle,
  Zap,
  Crown,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import FavoriteButton from "@/components/features/favorites/FavoriteButton";

const LEVELS = [
  { name: "Explorer", min: 0, color: "from-gray-400 to-gray-600", icon: "🌱" },
  { name: "Voyager", min: 3, color: "from-blue-400 to-blue-600", icon: "🧭" },
  {
    name: "Elite Traveler",
    min: 8,
    color: "from-purple-400 to-purple-600",
    icon: "✈️",
  },
  {
    name: "Nomad Prestige",
    min: 15,
    color: "from-amber-400 to-amber-600",
    icon: "👑",
  },
  {
    name: "Global Legend",
    min: 30,
    color: "from-rose-400 to-rose-600",
    icon: "🌍",
  },
];

type ProfileState = {
  fullName: string;
  phone: string;
  locale: string;
  avatarUrl: string | null;
};

function getLevel(stays: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (stays >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  return { current, next, staysToNext: Math.max(0, next.min - stays) };
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [profile, setProfile] = useState<ProfileState>({
    fullName: "",
    phone: "",
    locale: "vi",
    avatarUrl: null,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      if (!isMounted) return;
      setUser(session.user);

      const userId = session.user.id;
      const [profileRes, bookingsRes, favoritesRes, reviewsRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, phone, locale, avatar_url")
            .eq("id", userId)
            .limit(1),
          supabase
            .from("bookings")
            .select(
              "id, check_in_date, check_out_date, total_price, status, homestay:homestays(name, slug, city, homestay_images(url))",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("favorites")
            .select(
              "id, property_id, homestay:homestays(id, name, slug, city, price_per_night, homestay_images(url))",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("reviews")
            .select(
              "id, rating, comment, created_at, homestay_id, homestay:homestays(name, slug, city)",
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      if (!isMounted) return;

      const profileRow = profileRes.data?.[0];
      const displayName =
        profileRow?.full_name ||
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        "";
      const avatarUrl =
        profileRow?.avatar_url ||
        session.user.user_metadata?.avatar_url ||
        null;

      setProfile({
        fullName: displayName,
        phone: profileRow?.phone || "",
        locale: profileRow?.locale || "vi",
        avatarUrl,
      });

      setBookings(bookingsRes.data || []);
      setFavorites(favoritesRes.data || []);
      setReviews(reviewsRes.data || []);

      if (
        profileRes.error ||
        bookingsRes.error ||
        favoritesRes.error ||
        reviewsRes.error
      ) {
        setDataError(
          "Khong the tai day du thong tin tai khoan. Vui long thu lai.",
        );
      }

      setDataLoading(false);
      setLoading(false);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full"
        />
      </div>
    );

  const name =
    profile.fullName ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0];
  const avatar = profile.avatarUrl || user.user_metadata?.avatar_url || null;
  const totalStays = bookings.length;
  const savedCount = favorites.length;
  const reviewCount = reviews.length;
  const { current: level, next: nextLevel, staysToNext } = getLevel(totalStays);
  const progress =
    nextLevel.min > 0 ? Math.min(100, (totalStays / nextLevel.min) * 100) : 100;

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: User },
    { id: "trips", label: "Chuyến đi", icon: Plane },
    { id: "saved", label: "Đã lưu", icon: Heart },
    { id: "wallet", label: "Ví", icon: Wallet },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <div className="relative pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start gap-8"
          >
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-purple-500 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-zinc-950"
                />
              ) : (
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-4xl font-bold border-4 border-zinc-950">
                  {name?.[0]?.toUpperCase()}
                </div>
              )}
              <button className="absolute bottom-1 right-1 bg-zinc-800 p-2 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-700">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-black">
                  Xin chào, {name} {level.icon}
                </h1>
              </div>
              <p className="text-zinc-400 mb-4">{user.email}</p>

              {/* Level */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 max-w-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`bg-gradient-to-r ${level.color} bg-clip-text text-transparent font-extrabold text-lg`}
                    >
                      {level.name}
                    </span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {totalStays} chuyến · Còn {staysToNext} để lên{" "}
                    {nextLevel.name}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r ${level.color} rounded-full`}
                  />
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Chuyến đi", value: totalStays, icon: Plane },
                { label: "Đã lưu", value: savedCount, icon: Heart },
                { label: "Đánh giá", value: reviewCount, icon: Star },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors cursor-default"
                >
                  <s.icon className="w-5 h-5 mx-auto mb-2 text-zinc-400" />
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[72px] z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {dataError && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {dataError}
          </div>
        )}
        {activeTab === "overview" && <OverviewTab name={name} level={level} />}
        {activeTab === "trips" && (
          <TripsTab bookings={bookings} loading={dataLoading} />
        )}
        {activeTab === "saved" && (
          <SavedTab favorites={favorites} loading={dataLoading} />
        )}
        {activeTab === "wallet" && <WalletTab />}
        {activeTab === "security" && <SecurityTab user={user} />}
        {activeTab === "settings" && (
          <SettingsTab
            user={user}
            profile={profile}
            onProfileSaved={(updatedUser, nextProfile) => {
              if (updatedUser) setUser(updatedUser);
              setProfile((prev) => ({ ...prev, ...nextProfile }));
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ========== TAB: OVERVIEW ========== */
function OverviewTab({ name, level }: { name: string; level: any }) {
  const quickLinks = [
    {
      href: "/bookings",
      icon: CalendarCheck,
      label: "Đặt phòng & Chuyến đi",
      desc: "Xem lịch trình sắp tới",
      color: "from-blue-500/20 to-blue-600/5",
    },
    {
      href: "/favorites",
      icon: Heart,
      label: "Đã lưu",
      desc: "Bộ sưu tập yêu thích",
      color: "from-rose-500/20 to-rose-600/5",
    },
    {
      href: "/reviews",
      icon: Star,
      label: "Đánh giá",
      desc: "Reviews đã viết",
      color: "from-amber-500/20 to-amber-600/5",
    },
    {
      href: "/host",
      icon: Globe,
      label: "Host Dashboard",
      desc: "Quản lý chỗ ở của bạn",
      color: "from-emerald-500/20 to-emerald-600/5",
    },
  ];

  const achievements = [
    { icon: "🎯", title: "Chuyến đi đầu tiên", done: true },
    { icon: "⭐", title: "Đánh giá đầu tiên", done: true },
    { icon: "💎", title: "5 lượt đặt phòng", done: false },
    { icon: "🌍", title: "3 thành phố", done: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={link.href}
              className={`block bg-gradient-to-br ${link.color} border border-white/5 rounded-2xl p-6 hover:border-white/20 hover:scale-[1.02] transition-all group`}
            >
              <link.icon className="w-6 h-6 mb-3 text-zinc-300 group-hover:text-white transition-colors" />
              <h3 className="font-bold mb-1">{link.label}</h3>
              <p className="text-sm text-zinc-500">{link.desc}</p>
              <ChevronRight className="w-4 h-4 mt-3 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Achievements + Membership */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Membership Card */}
        <div className="lg:col-span-2">
          <div
            className={`relative overflow-hidden bg-gradient-to-br ${level.color} rounded-3xl p-8 h-full`}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <p className="text-white/60 text-sm font-medium mb-1">
                STAYSAGA MEMBERSHIP
              </p>
              <h3 className="text-2xl font-black mb-6">{level.name}</h3>
              <p className="text-white/80 text-sm mb-1">{name}</p>
              <p className="text-white/50 text-xs">Member since 2026</p>
              <div className="mt-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">
                  Ưu đãi giảm 10% cho chuyến tiếp theo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-3 bg-white/5 border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Thành tựu
            </h3>
            <span className="text-xs text-zinc-500">2/4 hoàn thành</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`text-center p-4 rounded-2xl border transition-all ${a.done ? "bg-white/5 border-white/10" : "bg-zinc-900/50 border-zinc-800/50 opacity-50"}`}
              >
                <span className="text-2xl block mb-2">{a.icon}</span>
                <p className="text-xs font-medium">{a.title}</p>
                {a.done && (
                  <p className="text-[10px] text-emerald-400 mt-1">✓ Đã đạt</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-rose-500/10 border border-white/5 rounded-3xl p-6 flex items-center gap-5">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Gợi ý từ AI ✨</h3>
          <p className="text-sm text-zinc-400">
            Dựa trên lịch sử tìm kiếm, bạn có thể thích{" "}
            <strong className="text-white">Cabin rừng thông Đà Lạt</strong> —
            giá từ 1.200.000đ/đêm.
          </p>
        </div>
        <Link
          href="/homestays?location=Đà+Lạt"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
        >
          Xem ngay
        </Link>
      </div>
    </motion.div>
  );
}

/* ========== TAB: TRIPS ========== */
function TripsTab({
  bookings,
  loading,
}: {
  bookings: any[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <Plane className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Chưa có chuyến đi nào</h2>
        <p className="text-zinc-500 mb-6">
          Khám phá những homestay tuyệt vời và bắt đầu hành trình!
        </p>
        <Link
          href="/homestays"
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
        >
          Khám phá ngay
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {bookings.map((booking: any) => {
        const status = booking.status || "PENDING";
        const statusClass =
          status === "CONFIRMED"
            ? "bg-emerald-500/10 text-emerald-300"
            : status === "PENDING"
              ? "bg-amber-500/10 text-amber-300"
              : status === "CANCELLED"
                ? "bg-rose-500/10 text-rose-300"
                : "bg-blue-500/10 text-blue-300";

        const statusLabel =
          status === "CONFIRMED"
            ? "Đã xác nhận"
            : status === "PENDING"
              ? "Chờ thanh toán"
              : status === "CANCELLED"
                ? "Đã hủy"
                : "Hoàn thành";

        const image =
          booking.homestay?.homestay_images?.[0]?.url ||
          "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=500";

        const checkIn = booking.check_in_date
          ? new Date(booking.check_in_date).toLocaleDateString("vi-VN")
          : "";
        const checkOut = booking.check_out_date
          ? new Date(booking.check_out_date).toLocaleDateString("vi-VN")
          : "";

        return (
          <Link
            key={booking.id}
            href={
              booking.homestay?.slug
                ? `/homestays/${booking.homestay.slug}`
                : "/homestays"
            }
            className="group flex flex-col md:flex-row bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
          >
            <div className="md:w-40 h-28 md:h-auto">
              <img
                src={image}
                alt={booking.homestay?.name || "Homestay"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-white mb-1">
                    {booking.homestay?.name || "Homestay"}
                  </h3>
                  <p className="text-sm text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{" "}
                    {booking.homestay?.city || "Việt Nam"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <CalendarCheck className="w-4 h-4" /> {checkIn} - {checkOut}
                </span>
                <span className="font-bold text-white">
                  {Number(booking.total_price || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

/* ========== TAB: SAVED ========== */
function SavedTab({
  favorites,
  loading,
}: {
  favorites: any[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <Heart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Chưa lưu chỗ ở nào</h2>
        <p className="text-zinc-500 mb-6">
          Nhấn vào trái tim để lưu chỗ ở yêu thích.
        </p>
        <Link
          href="/homestays"
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
        >
          Khám phá ngay
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {favorites.map((fav: any) => {
        const homestay = fav.homestay;
        const image =
          homestay?.homestay_images?.[0]?.url ||
          "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=500";
        const price = Number(homestay?.price_per_night || 0);
        const propertyId = fav.property_id || homestay?.id;

        return (
          <Link
            key={fav.id}
            href={homestay?.slug ? `/homestays/${homestay.slug}` : "/homestays"}
            className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={image}
                alt={homestay?.name || "Homestay"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {propertyId && (
                <FavoriteButton
                  propertyId={propertyId}
                  initialFavorited
                  className="absolute top-4 right-4 bg-white/85 backdrop-blur-sm p-2 shadow-md"
                />
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-white line-clamp-1">
                {homestay?.name || "Homestay"}
              </h3>
              <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {homestay?.city || "Việt Nam"}
              </p>
              <div className="mt-3">
                <span className="text-lg font-black text-rose-400">
                  {price.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-zinc-500 text-sm"> /đêm</span>
              </div>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

/* ========== TAB: WALLET ========== */
function WalletTab() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Số dư ví",
            value: "0đ",
            icon: Wallet,
            color: "from-emerald-500/20 to-emerald-600/5",
          },
          {
            label: "Cashback",
            value: "0đ",
            icon: TrendingUp,
            color: "from-blue-500/20 to-blue-600/5",
          },
          {
            label: "Voucher",
            value: "1",
            icon: Gift,
            color: "from-amber-500/20 to-amber-600/5",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${item.color} border border-white/5 rounded-2xl p-6`}
          >
            <item.icon className="w-6 h-6 mb-3 text-zinc-400" />
            <p className="text-2xl font-black">{item.value}</p>
            <p className="text-sm text-zinc-500">{item.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold mb-4">Lịch sử giao dịch</h3>
        <p className="text-zinc-500 text-sm text-center py-8">
          Chưa có giao dịch nào.
        </p>
      </div>
    </motion.div>
  );
}

/* ========== TAB: SECURITY ========== */
function SecurityTab({ user }: { user: any }) {
  const providers = user?.app_metadata?.providers || [];
  const isEmailVerified = Boolean(user?.email_confirmed_at);
  const hasGoogle = providers.includes("google");
  const hasFacebook = providers.includes("facebook");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 max-w-2xl"
    >
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Điểm bảo mật: Tốt</h3>
            <p className="text-sm text-zinc-500">
              Tài khoản của bạn được bảo vệ.
            </p>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-[70%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
        </div>
      </div>
      {[
        { label: "Email xác thực", value: user.email, done: isEmailVerified },
        { label: "Xác thực 2 lớp (2FA)", value: "Chưa bật", done: false },
        {
          label: "Dang nhap bang Google",
          value: hasGoogle ? "Da lien ket" : "Chua lien ket",
          done: hasGoogle,
        },
        {
          label: "Dang nhap bang Facebook",
          value: hasFacebook ? "Da lien ket" : "Chua lien ket",
          done: hasFacebook,
        },
      ].map((item, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="font-medium">{item.label}</p>
            <p className="text-sm text-zinc-500">{item.value}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${item.done ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
          >
            {item.done ? "✓ Đã bật" : "Bật ngay"}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

/* ========== TAB: SETTINGS ========== */
function SettingsTab({
  user,
  profile,
  onProfileSaved,
}: {
  user: any;
  profile: ProfileState;
  onProfileSaved: (
    updatedUser: any,
    nextProfile: Partial<ProfileState>,
  ) => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: profile.fullName,
    phone: profile.phone,
    locale: profile.locale,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setForm({
      fullName: profile.fullName,
      phone: profile.phone,
      locale: profile.locale,
    });
  }, [profile.fullName, profile.phone, profile.locale]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: form.fullName },
    });

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: form.fullName || null,
        phone: form.phone || null,
        locale: form.locale || null,
      },
      { onConflict: "id" },
    );

    if (error || profileError) {
      setMessage({
        type: "error",
        text:
          error?.message ||
          profileError?.message ||
          "Khong the luu thay doi. Vui long thu lai.",
      });
    } else {
      setMessage({ type: "success", text: "Da luu thay doi." });
    }

    if (data?.user) {
      onProfileSaved(data.user, {
        fullName: form.fullName,
        phone: form.phone,
        locale: form.locale,
      });
    }

    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold mb-5">Thong tin ca nhan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">
              Ho va ten
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Email</label>
            <input
              type="email"
              defaultValue={user.email}
              disabled
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">
              So dien thoai
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Chua cap nhat"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-white placeholder-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Ngon ngu</label>
            <select
              value={form.locale}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, locale: e.target.value }))
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl outline-none text-white"
            >
              <option value="vi">🇻🇳 Tieng Viet</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
        </div>
        {message && (
          <p
            className={`mt-4 text-sm ${message.type === "success" ? "text-emerald-400" : "text-rose-400"}`}
          >
            {message.text}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Dang luu..." : "Luu thay doi"}
        </button>
      </div>
      <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
        <h3 className="font-bold text-red-400 mb-2">Vung nguy hiem</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Xoa tai khoan vinh vien. Hanh dong nay khong the hoan tac.
        </p>
        <button className="px-6 py-2.5 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/10 transition-colors text-sm">
          Xoa tai khoan
        </button>
      </div>
    </motion.div>
  );
}
