"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Users, ChevronLeft, Plus, Trash2, Calendar, Phone, Loader2, User } from "lucide-react";
import Link from "next/link";
import { addTravelCompanionAction, deleteTravelCompanionAction } from "@/core/profile/profileActions";

export default function TravelersPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [companions, setCompanions] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Fetch companions
  const fetchCompanions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("travel_companions")
        .select("*")
        .eq("user_id", userId);

      if (data) {
        setCompanions(data);
      }
    } catch (err) {
      console.warn("Bảng travel_companions chưa được tạo, chạy với chế độ giả lập.");
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
      await fetchCompanions(session.user.id);
      setLoading(false);
    };
    loadData();
    return () => { isMounted = false; };
  }, [router, supabase]);

  const handleAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setSubmitting(true);
    const res = await addTravelCompanionAction(fullName, dob || undefined, phone || undefined);

    if (res.error) {
      alert(res.error);
    } else {
      if (res.isDemo && res.data) {
        setCompanions((prev) => [...prev, res.data]);
        alert("Đã thêm thành công (Ghi nhận tạm thời cục bộ).");
      } else {
        await fetchCompanions(user.id);
        alert("Đã thêm người đi cùng thành công!");
      }
      setShowAddForm(false);
      setFullName("");
      setDob("");
      setPhone("");
    }
    setSubmitting(false);
  };

  const handleDeleteCompanion = async (id: string) => {
    if (!confirm("Bạn muốn xóa người đi cùng này khỏi danh sách?")) return;

    const res = await deleteTravelCompanionAction(id);
    if (res.error) {
      alert(res.error);
    } else {
      setCompanions((prev) => prev.filter((c) => c.id !== id));
      alert("Đã xóa thành công!");
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

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Người đi cùng</h1>
        <p className="text-slate-500 text-sm mb-8">Lưu thông tin những người thường xuyên đồng hành cùng bạn để tiện lợi hơn khi đặt homestay.</p>

        {/* Travelers list */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Danh sách người đi cùng</h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm người mới
              </button>
            )}
          </div>

          {companions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Bạn chưa thêm người đi cùng nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companions.map((comp) => (
                <div key={comp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{comp.full_name}</h4>
                      <div className="space-y-0.5 mt-1">
                        {comp.date_of_birth && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Ngày sinh: {new Date(comp.date_of_birth).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                        {comp.phone && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            SĐT: {comp.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCompanion(comp.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa thông tin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Companion Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Thêm người đi cùng mới</h3>
            <form onSubmit={handleAddCompanion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Ngày sinh (Tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Số điện thoại (Tùy chọn)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập SĐT"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white outline-none"
                  />
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
                  Thêm thông tin
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
