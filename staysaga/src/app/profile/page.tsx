"use client";

import { useState, useEffect, useMemo } from "react";
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
  Coffee,
  HelpCircle,
  Lock,
  FileText,
  Home,
  CheckCircle2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";

// Loyalty Helper
function getLoyaltyLevel(completedCount: number) {
  if (completedCount >= 5) {
    return {
      level: 3,
      name: "StaySaga Cấp 3",
      discount: "15%",
      nextLevelName: "",
      needed: 0,
      rewards: [
        "Giảm 15% khi lưu trú tại các chỗ nghỉ đủ điều kiện",
        "Ưu đãi nâng hạng phòng miễn phí",
        "Bữa sáng miễn phí tại các chỗ nghỉ hỗ trợ",
        "Hỗ trợ ưu tiên 24/7 từ StaySaga",
      ],
    };
  } else if (completedCount >= 2) {
    return {
      level: 2,
      name: "StaySaga Cấp 2",
      discount: "12%",
      nextLevelName: "StaySaga Cấp 3",
      needed: 5 - completedCount,
      rewards: [
        "Giảm 10-12% khi lưu trú tại các chỗ nghỉ đủ điều kiện",
        "Ưu đãi nâng hạng phòng miễn phí",
        "Hỗ trợ nhanh chóng từ StaySaga",
      ],
    };
  } else {
    return {
      level: 1,
      name: "StaySaga Cấp 1",
      discount: "10%",
      nextLevelName: "StaySaga Cấp 2",
      needed: 2 - completedCount,
      rewards: [
        "Giảm 10% khi lưu trú tại các chỗ nghỉ đủ điều kiện",
        "Nhận thông báo giá tốt và ưu đãi độc quyền",
      ],
    };
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Counts & Statistics
  const [bookingsStats, setBookingsStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    cancelled: 0,
  });
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
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

      try {
        // 1. Fetch Profile
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileData && isMounted) {
          setProfile(profileData);
        }

        // 2. Fetch Bookings stats
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from("bookings")
          .select("id, status, check_in_date, check_out_date")
          .eq("user_id", userId);

        if (bookingsData && isMounted) {
          const now = new Date();
          let completed = 0;
          let upcoming = 0;
          let cancelled = 0;

          bookingsData.forEach((b: any) => {
            if (b.status === "CANCELLED") {
              cancelled++;
            } else {
              const checkOut = new Date(b.check_out_date);
              if (b.status === "COMPLETED" || checkOut < now) {
                completed++;
              } else {
                upcoming++;
              }
            }
          });

          setBookingsStats({
            total: bookingsData.length,
            completed,
            upcoming,
            cancelled,
          });
        }

        // 3. Fetch Favorites count
        const { count: favsCount, error: favsErr } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (favsCount !== null && isMounted) {
          setFavoritesCount(favsCount);
        }

        // 4. Fetch Reviews count
        const { count: revsCount, error: revsErr } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (revsCount !== null && isMounted) {
          setReviewsCount(revsCount);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin tài khoản:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-rose-600 animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  // Handle display variables
  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Khách hàng";

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    null;

  // Loyalty calculations
  const loyalty = getLoyaltyLevel(bookingsStats.completed);
  const nextLevel = loyalty.nextLevelName;
  const progressPercent =
    loyalty.level === 3
      ? 100
      : loyalty.level === 2
      ? ((bookingsStats.completed - 2) / 3) * 100
      : (bookingsStats.completed / 2) * 100;

  // StaySaga Colors: Primary Rose-Red gradient (adapted Booking.com layout)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      {/* Booking-style Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: User Welcome */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white shadow-lg shrink-0">
                {avatarUrl ? (
                  <SafeImage
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-rose-600 text-white flex items-center justify-center font-bold text-xl md:text-2xl">
                    {fullName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                  Chào {fullName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-white text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    {loyalty.name}
                  </span>
                  <span className="text-xs text-rose-100">
                    · {bookingsStats.completed} đơn đặt phòng hoàn tất
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Membership progress card */}
            <div className="bg-white text-slate-800 rounded-xl p-4 md:p-6 shadow-md w-full md:max-w-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 rounded-lg shrink-0 text-rose-600">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {loyalty.level < 3 ? (
                    <>
                      <h4 className="text-sm font-bold text-slate-900">
                        Cấp thành viên tiếp theo: {nextLevel}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Bạn còn <strong className="text-slate-900">{loyalty.needed}</strong> đơn đặt nữa để lên cấp tiếp theo.
                      </p>
                      <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                        <div
                          className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#febb02] fill-[#febb02]" />
                        Bạn đang ở cấp thành viên cao nhất
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Tận hưởng trọn vẹn mọi ưu đãi đẳng cấp nhất của StaySaga Plus.
                      </p>
                    </>
                  )}
                  <Link
                    href="/profile/rewards"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline mt-3 inline-block"
                  >
                    Kiểm tra tiến độ của bạn
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Tặng thưởng & Ưu đãi */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-lg">Tặng thưởng & Ưu đãi</h3>
              </div>
              <p className="text-sm text-slate-500 font-bold mb-4">
                Bạn đang được áp dụng chiết khấu {loyalty.discount} StaySaga!
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Tận hưởng ưu đãi và giảm giá cho các chỗ nghỉ đủ điều kiện.
              </p>
              <ul className="space-y-2">
                {loyalty.rewards.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
              <Link
                href="/profile/rewards"
                className="text-sm font-semibold text-rose-600 hover:text-rose-800 flex items-center justify-between"
              >
                <span>Tìm hiểu thêm về tặng thưởng</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Thông tin thanh toán */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Thông tin thanh toán</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/profile/wallet"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Tặng thưởng & Ví</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/profile/payment-methods"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Phương thức thanh toán</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/profile/transactions"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Giao dịch</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Hoạt động du lịch */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Hoạt động du lịch</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/bookings"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Plane className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Chuyến đi và đơn đặt</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {bookingsStats.upcoming > 0 && (
                      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {bookingsStats.upcoming} sắp tới
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
                <Link
                  href="/favorites"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Danh sách đã lưu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {favoritesCount > 0 && (
                      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {favoritesCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
                <Link
                  href="/reviews"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Đánh giá của tôi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {reviewsCount > 0 && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {reviewsCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4: Quản lý tài khoản */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Quản lý tài khoản</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/profile/personal"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Thông tin cá nhân</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/profile/security"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Cài đặt bảo mật</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/profile/travelers"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Người đi cùng</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 5: Cài đặt */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Cài đặt</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/profile/settings"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Cài đặt chung</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/profile/email-settings"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Cài đặt email</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 6: Trợ giúp */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Trợ giúp</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/help/contact"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Liên hệ dịch vụ khách hàng</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/help/safety"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Trung tâm thông tin bảo mật</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/help/complaints"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Giải quyết khiếu nại</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 7: Pháp lý và quyền riêng tư */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Pháp lý và quyền riêng tư</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/profile/privacy"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Quản lý quyền riêng tư và dữ liệu</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
                <Link
                  href="/legal/content-guidelines"
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                    <span className="text-sm text-slate-700 font-medium">Hướng dẫn nội dung</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              </div>
            </div>
          </div>

          {/* Card 8: Dành cho chủ chỗ nghỉ */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden col-span-1 md:col-span-2 lg:col-span-1">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4">Dành cho chủ chỗ nghỉ</h3>
              <div className="divide-y divide-slate-100">
                <Link
                  href="/host/list"
                  className="flex items-center justify-between py-3 bg-rose-50/70 hover:bg-rose-100/80 -mx-3 px-3 rounded-lg transition-all group border border-rose-100/50"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-rose-600 group-hover:text-rose-700 shrink-0" />
                    <span className="text-sm text-rose-700 font-bold">Đăng chỗ nghỉ</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {profile?.role === "PARTNER" && (
                  <Link
                    href="/host"
                    className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                      <span className="text-sm text-slate-700 font-medium">Quản lý chỗ nghỉ</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                )}

                {profile?.role === "ADMIN" && (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center justify-between py-3 hover:bg-slate-50/50 -mx-3 px-3 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                        <span className="text-sm text-slate-700 font-medium">Admin Dashboard</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
