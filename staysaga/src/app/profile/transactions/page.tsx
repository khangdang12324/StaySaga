"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
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
        const { data, error } = await supabase
          .from("bookings")
          .select("id, created_at, total_price, status, homestay:homestays(name)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (data && isMounted) {
          setTransactions(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử giao dịch:", err);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Lịch sử giao dịch</h1>
        <p className="text-slate-500 text-sm mb-8">Danh sách các hóa đơn thanh toán và đặt phòng của bạn tại StaySaga.</p>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Bạn chưa có bất kỳ giao dịch đặt phòng nào trên hệ thống.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-200">
                    <th className="p-4">Ngày giao dịch</th>
                    <th className="p-4">Chi tiết chỗ nghỉ</th>
                    <th className="p-4">Phương thức</th>
                    <th className="p-4 text-right">Tổng tiền</th>
                    <th className="p-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(t.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {t.homestay?.name || "Đặt phòng Homestay"}
                      </td>
                      <td className="p-4 flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span>Ví / Thẻ</span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        {Number(t.total_price || 0).toLocaleString("vi-VN")}đ
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            t.status === "CONFIRMED" || t.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700"
                              : t.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {t.status === "CONFIRMED"
                            ? "Đã xác nhận"
                            : t.status === "COMPLETED"
                            ? "Đã hoàn tất"
                            : t.status === "CANCELLED"
                            ? "Đã hủy"
                            : "Đang chờ"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
