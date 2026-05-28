"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Settings, ChevronLeft, Globe, DollarSign, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { updatePreferencesAction } from "@/core/profile/profileActions";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Setting fields
  const [lang, setLang] = useState("vi");
  const [currency, setCurrency] = useState("VND");

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", session.user.id)
          .single();

        if (profile?.preferences && isMounted) {
          setLang(profile.preferences.lang || "vi");
          setCurrency(profile.preferences.currency || "VND");
        }
      } catch (err) {
        console.error("Lỗi khi tải preferences:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const preferences = { lang, currency };
    const res = await updatePreferencesAction(preferences);

    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Đã cập nhật cài đặt chung thành công!" });
      // Update client cookies to reflect changes (Navbar uses cookies for currency/language)
      document.cookie = `currency=${currency}; path=/; max-age=31536000`;
      document.cookie = `lang=${lang === "vi" ? "VN" : "EN"}; path=/; max-age=31536000`;
    }
    setSaving(false);
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cài đặt chung</h1>
        <p className="text-slate-500 text-sm mb-8">Điều chỉnh ngôn ngữ hiển thị, tiền tệ mặc định khi xem giá phòng homestay.</p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Language Setting */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                Ngôn ngữ hiển thị
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:bg-white focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
              >
                <option value="vi">Tiếng Việt (Mặc định)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Currency Setting */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                Tiền tệ thanh toán
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:bg-white focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
              >
                <option value="VND">VND (đ)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm font-semibold ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
