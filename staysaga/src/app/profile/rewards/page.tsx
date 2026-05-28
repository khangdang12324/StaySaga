"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Award, ChevronLeft, Gift, ShieldAlert, Sparkles, CheckCircle2, Ticket } from "lucide-react";
import Link from "next/link";

export default function RewardsPage() {
  const [user, setUser] = useState<any>(null);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      if (!isMounted) return;
      setUser(session.user);

      try {
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("status, check_out_date")
          .eq("user_id", session.user.id);

        if (bookingsData && isMounted) {
          const now = new Date();
          const completed = bookingsData.filter((b: any) => {
            const checkOut = new Date(b.check_out_date);
            return b.status === "COMPLETED" || (b.status !== "CANCELLED" && checkOut < now);
          }).length;
          setBookingsCount(completed);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin bookings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <p className="text-gray-600 font-medium">Đang tải...</p>
      </div>
    );
  }

  const levels = [
    {
      level: 1,
      name: "StaySaga Cấp 1",
      requirement: "0 - 1 đơn đặt phòng hoàn tất",
      perks: [
        "Giảm 10% giá trị phòng tại các homestay áp dụng ưu đãi",
        "Truy cập các chương trình khuyến mãi giờ chót",
      ],
      active: bookingsCount < 2,
    },
    {
      level: 2,
      name: "StaySaga Cấp 2",
      requirement: "2 - 4 đơn đặt phòng hoàn tất",
      perks: [
        "Giảm 12% giá trị phòng tại các homestay áp dụng ưu đãi",
        "Ưu đãi nâng hạng phòng miễn phí đối với chỗ nghỉ tham gia",
        "Hỗ trợ nhanh chóng từ đội ngũ chăm sóc khách hàng",
      ],
      active: bookingsCount >= 2 && bookingsCount < 5,
    },
    {
      level: 3,
      name: "StaySaga Cấp 3",
      requirement: "Từ 5 đơn đặt phòng hoàn tất trở lên",
      perks: [
        "Giảm 15% giá trị phòng tại tất cả chỗ nghỉ đủ điều kiện",
        "Ưu đãi nâng hạng phòng miễn phí ưu tiên",
        "Bữa sáng miễn phí tại các homestay hỗ trợ",
        "Hỗ trợ ưu tiên 24/7 từ chuyên viên kỹ thuật",
      ],
      active: bookingsCount >= 5,
    },
  ];

  const activeLevel = bookingsCount >= 5 ? 3 : bookingsCount >= 2 ? 2 : 1;
  const currentLevelInfo = levels[activeLevel - 1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tặng thưởng & Ưu đãi StaySaga</h1>
        <p className="text-slate-500 text-sm mb-8">Theo dõi tiến độ thăng cấp thành viên và nhận các khuyến mãi độc quyền dành riêng cho bạn.</p>

        {/* Current loyalty status */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-500 text-white rounded-2xl p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-rose-100 font-semibold bg-rose-900/50 px-3 py-1 rounded-full">
              Thành viên hiện tại
            </span>
            <h2 className="text-2xl md:text-3xl font-black mt-3">{currentLevelInfo.name}</h2>
            <p className="text-sm text-rose-100 mt-2">
              Bạn đã hoàn tất <strong className="text-white">{bookingsCount}</strong> chuyến đi.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#febb02]" />
              Ưu đãi áp dụng hiện tại
            </h3>
            <p className="text-2xl font-black text-[#febb02] mt-1">Giảm tới {activeLevel === 3 ? "15%" : activeLevel === 2 ? "12%" : "10%"}</p>
            <p className="text-xs text-rose-100 mt-1">Cho tất cả các chuyến đi đủ điều kiện</p>
          </div>
        </div>

        {/* Level Progression details */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900">Các cấp thành viên StaySaga</h3>
          <div className="grid grid-cols-1 gap-4">
            {levels.map((lvl) => (
              <div
                key={lvl.level}
                className={`p-6 rounded-xl border transition-all ${
                  lvl.active
                    ? "bg-white border-rose-600 shadow-sm relative overflow-hidden"
                    : "bg-white/60 border-slate-200 opacity-75"
                }`}
              >
                {lvl.active && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    Đang hoạt động
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Award className={`w-5 h-5 ${lvl.active ? "text-[#febb02]" : "text-slate-400"}`} />
                  <h4 className="font-bold text-slate-900">{lvl.name}</h4>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-4">{lvl.requirement}</p>
                <div className="space-y-2">
                  {lvl.perks.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${lvl.active ? "text-emerald-500" : "text-slate-300"}`} />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Voucher List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-rose-600" />
            Mã giảm giá khả dụng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voucher 1 */}
            <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Thành viên mới
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-2">Giảm 10% Đặt Homestay</h4>
                <p className="text-xs text-slate-500 mt-1">Mã: STAYSAGANEW</p>
                <p className="text-[10px] text-slate-400 mt-2">HSD: 31/12/2026</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("STAYSAGANEW");
                  alert("Đã sao chép mã giảm giá!");
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-colors"
              >
                Sao chép
              </button>
            </div>

            {/* Voucher 2 */}
            {activeLevel >= 2 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Thành viên Cấp 2
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Giảm 12% Đặt Homestay</h4>
                  <p className="text-xs text-slate-500 mt-1">Mã: SAGAPLUS2</p>
                  <p className="text-[10px] text-slate-400 mt-2">HSD: 31/12/2026</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("SAGAPLUS2");
                    alert("Đã sao chép mã giảm giá!");
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-colors"
                >
                  Sao chép
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between gap-4 opacity-50 relative">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Chưa mở khóa
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-2">Giảm 12% Đặt Homestay</h4>
                  <p className="text-xs text-slate-500 mt-1">Đạt Cấp 2 để mở khóa</p>
                </div>
                <button disabled className="px-3 py-1.5 bg-slate-300 text-white text-xs font-bold rounded-lg whitespace-nowrap cursor-not-allowed">
                  Khóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
