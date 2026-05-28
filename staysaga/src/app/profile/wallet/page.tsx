"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Wallet, ChevronLeft, TrendingUp, Gift, Clock } from "lucide-react";
import Link from "next/link";

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
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
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tặng thưởng & Ví StaySaga</h1>
        <p className="text-slate-500 text-sm mb-8">Quản lý số dư, tiền tích lũy và kiểm tra lịch sử giao dịch của bạn tại StaySaga.</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-500">Số dư ví</span>
            </div>
            <p className="text-3xl font-black text-slate-900">0đ</p>
            <p className="text-xs text-slate-400 mt-2">Dùng để thanh toán đặt phòng nhanh</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-500">Cashback lũy kế</span>
            </div>
            <p className="text-3xl font-black text-slate-900">0đ</p>
            <p className="text-xs text-slate-400 mt-2">Được tích lũy sau mỗi chuyến đi</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Gift className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-500">Voucher khả dụng</span>
            </div>
            <p className="text-3xl font-black text-slate-900">1</p>
            <p className="text-xs text-slate-400 mt-2">Nhấp xem chi tiết ở mục tặng thưởng</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Lịch sử giao dịch ví
          </h3>
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Chưa phát sinh giao dịch nào.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
