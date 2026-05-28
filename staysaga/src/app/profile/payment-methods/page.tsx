"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, Trash2, Plus, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { addDemoPaymentMethodAction, deletePaymentMethodAction } from "@/core/profile/profileActions";

export default function PaymentMethodsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [provider, setProvider] = useState("Visa");
  const [brand, setBrand] = useState("Visa");
  const [last4, setLast4] = useState("4242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("2028");

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Fetch cards
  const fetchCards = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId);

      if (data) {
        setCards(data);
      }
    } catch (err) {
      console.warn("Bảng payment_methods chưa được migrate, hoạt động với state cục bộ.");
    }
  };

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
      await fetchCards(session.user.id);
      setLoading(false);
    };
    loadData();
    return () => { isMounted = false; };
  }, [router, supabase]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!last4 || last4.length !== 4 || isNaN(Number(last4))) {
      alert("4 số cuối thẻ phải là số và có độ dài bằng 4");
      return;
    }
    setSubmitting(true);

    const monthNum = parseInt(expMonth);
    const yearNum = parseInt(expYear);

    const res = await addDemoPaymentMethodAction(provider, brand, last4, monthNum, yearNum);

    if (res.error) {
      alert(res.error);
    } else {
      if (res.isDemo && res.data) {
        // Fallback state update
        setCards((prev) => [...prev, res.data]);
        alert("Đã thêm thẻ thành công (Lưu giả lập cục bộ do chưa chạy migration DB).");
      } else {
        await fetchCards(user.id);
        alert("Đã thêm phương thức thanh toán an toàn thành công!");
      }
      setShowAddForm(false);
      setLast4("");
    }
    setSubmitting(false);
  };

  const handleDeleteCard = async (id: string, isDemo: boolean) => {
    if (!confirm("Bạn chắc chắn muốn xóa phương thức thanh toán này?")) return;

    const res = await deletePaymentMethodAction(id);
    if (res.error) {
      alert(res.error);
    } else {
      if (res.isDemo) {
        setCards((prev) => prev.filter((c) => c.id !== id));
        alert("Đã xóa thẻ khỏi bộ nhớ giả lập.");
      } else {
        await fetchCards(user.id);
        alert("Đã xóa phương thức thanh toán.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <p className="text-gray-600 font-medium">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Phương thức thanh toán</h1>
        <p className="text-slate-500 text-sm mb-6">Liên kết phương thức thanh toán an toàn để giao dịch đặt phòng nhanh chóng.</p>

        {/* Security Warning alert */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 text-sm mb-8">
          <Shield className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-bold">Bảo mật thông tin thẻ tối đa</h4>
            <p className="mt-1 text-xs text-rose-700">
              StaySaga cam kết không lưu trữ số thẻ tín dụng hoặc mã bảo mật CVC của khách hàng trên hệ thống. Chúng tôi chỉ hiển thị và ghi nhận các thông tin thẻ cơ bản (4 số cuối, kỳ hạn thẻ) thông qua cổng thanh toán bảo mật liên kết.
            </p>
          </div>
        </div>

        {/* Card List */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Thẻ của bạn</h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm thẻ mới (Demo)
              </button>
            )}
          </div>

          {cards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Bạn chưa thêm phương thức thanh toán nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card) => (
                <div key={card.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {card.provider} ···· {card.last4}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Hạn dùng: {String(card.expiry_month).padStart(2, "0")}/{card.expiry_year}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCard(card.id, card.id.startsWith("0."))}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa phương thức thanh toán"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Card Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm thẻ thanh toán Demo</h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Cổng / Nhà cung cấp
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="JCB">JCB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Loại thẻ
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="JCB">JCB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    4 Số cuối thẻ
                  </label>
                  <input
                    type="text"
                    value={last4}
                    maxLength={4}
                    onChange={(e) => setLast4(e.target.value)}
                    placeholder="Ví dụ: 4242"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Tháng hết hạn
                    </label>
                    <select
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Năm hết hạn
                    </label>
                    <select
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                    >
                      {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Thêm thẻ
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
