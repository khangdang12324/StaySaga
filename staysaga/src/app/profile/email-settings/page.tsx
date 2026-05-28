"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { updateEmailSettingsAction } from "@/core/profile/profileActions";

export default function EmailSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings
  const [bookingConfirm, setBookingConfirm] = useState(true);
  const [promotional, setPromotional] = useState(false);
  const [tripReminder, setTripReminder] = useState(true);
  const [securityAlert, setSecurityAlert] = useState(true);

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

        if (profile?.preferences?.email_settings && isMounted) {
          const settings = profile.preferences.email_settings;
          setBookingConfirm(settings.bookingConfirm !== false);
          setPromotional(settings.promotional === true);
          setTripReminder(settings.tripReminder !== false);
          setSecurityAlert(settings.securityAlert !== false);
        }
      } catch (err) {
        console.error("Lỗi khi tải cài đặt email:", err);
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

    const emailSettings = {
      bookingConfirm,
      promotional,
      tripReminder,
      securityAlert,
    };

    const res = await updateEmailSettingsAction(emailSettings);

    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Đã cập nhật cài đặt thông báo email thành công!" });
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

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cài đặt thông báo email</h1>
        <p className="text-slate-500 text-sm mb-8">Lựa chọn các loại email và thông tin bạn muốn nhận từ StaySaga.</p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="divide-y divide-slate-100">
              {/* Option 1: Booking confirmation */}
              <div className="flex items-start justify-between py-4">
                <div className="pr-4">
                  <h3 className="font-bold text-slate-900 text-sm">Email xác nhận đặt phòng</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nhận email chi tiết hóa đơn và thông tin đặt phòng ngay sau khi thanh toán thành công.</p>
                </div>
                <input
                  type="checkbox"
                  checked={bookingConfirm}
                  onChange={(e) => setBookingConfirm(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 mt-1 shrink-0"
                />
              </div>

              {/* Option 2: Trip reminder */}
              <div className="flex items-start justify-between py-4">
                <div className="pr-4">
                  <h3 className="font-bold text-slate-900 text-sm">Email nhắc nhở chuyến đi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Thông báo nhắc nhở ngày check-in, check-out và hướng dẫn di chuyển đến homestay.</p>
                </div>
                <input
                  type="checkbox"
                  checked={tripReminder}
                  onChange={(e) => setTripReminder(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 mt-1 shrink-0"
                />
              </div>

              {/* Option 3: Promotional */}
              <div className="flex items-start justify-between py-4">
                <div className="pr-4">
                  <h3 className="font-bold text-slate-900 text-sm">Email khuyến mãi và ưu đãi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cập nhật tin tức, mã giảm giá độc quyền và các chỗ nghỉ đang thịnh hành từ StaySaga.</p>
                </div>
                <input
                  type="checkbox"
                  checked={promotional}
                  onChange={(e) => setPromotional(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 mt-1 shrink-0"
                />
              </div>

              {/* Option 4: Security alerts */}
              <div className="flex items-start justify-between py-4">
                <div className="pr-4">
                  <h3 className="font-bold text-slate-900 text-sm">Thông báo bảo mật</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nhận email thông báo khi có hoạt động đăng nhập lạ hoặc thay đổi thông tin tài khoản quan trọng.</p>
                </div>
                <input
                  type="checkbox"
                  checked={securityAlert}
                  disabled
                  className="w-4 h-4 accent-rose-600 mt-1 shrink-0 cursor-not-allowed"
                />
              </div>
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
