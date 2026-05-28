"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HelpCircle, ChevronLeft, MessageSquare, Briefcase, Mail, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { createSupportTicketAction } from "@/core/profile/profileActions";

export default function ContactHelpPage() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [bookingId, setBookingId] = useState("");

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
          .select("id, created_at, homestay:homestays(name)")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (bookingsData && isMounted) {
          setBookings(bookingsData);
        }
      } catch (err) {
        console.error("Không thể tải thông tin bookings cho ticket:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return;

    setSubmitting(true);
    setMessage(null);

    const res = await createSupportTicketAction(subject, content, bookingId || undefined);

    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({
        type: "success",
        text: "Gửi yêu cầu hỗ trợ thành công! Đội ngũ StaySaga sẽ liên hệ phản hồi qua email của bạn trong thời gian sớm nhất.",
      });
      setSubject("");
      setContent("");
      setBookingId("");
    }
    setSubmitting(false);
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

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Liên hệ dịch vụ khách hàng</h1>
        <p className="text-slate-500 text-sm mb-8">
          Gửi yêu cầu hỗ trợ về đặt phòng, khiếu nại chất lượng dịch vụ hoặc các vấn đề tài khoản.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Gửi yêu cầu mới</h4>
                <p className="text-xs text-slate-400">Thời gian phản hồi thông thường trong vòng 2 - 4 tiếng làm việc.</p>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Chủ đề hỗ trợ
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Lỗi thanh toán đặt phòng, Cần hỗ trợ check-in sớm..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:bg-white focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
                required
              />
            </div>

            {/* Booking Related (Optional) */}
            {bookings.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Đơn đặt phòng liên quan (Không bắt buộc)
                </label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:bg-white focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                >
                  <option value="">-- Chọn đơn đặt phòng liên quan --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.homestay?.name || "Homestay"} (Đặt ngày: {new Date(b.created_at).toLocaleDateString("vi-VN")})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message Content */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nội dung chi tiết yêu cầu
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung chi tiết phản ánh hoặc thắc mắc của bạn..."
                rows={5}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm outline-none focus:bg-white focus:border-rose-600 focus:ring-1 focus:ring-rose-600 transition-all"
                required
              />
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
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi yêu cầu hỗ trợ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
