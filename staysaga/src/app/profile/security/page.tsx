"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, Lock, Mail, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleResetPassword = async () => {
    setSending(true);
    setMessage(null);

    try {
      const origin = getPublicSiteOrigin();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: `Đã gửi liên kết đặt lại mật khẩu đến email ${user.email}. Vui lòng kiểm tra hộp thư đến của bạn.`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Đã xảy ra lỗi" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <p className="text-gray-600 font-medium">Đang tải...</p>
      </div>
    );
  }

  const providers = user?.app_metadata?.providers || [];
  const isOauth = providers.includes("google") || providers.includes("facebook");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 pt-[72px]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:text-rose-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span>Quay lại Tài khoản của tôi</span>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Cài đặt bảo mật</h1>
        <p className="text-slate-500 text-sm mb-8">Quản lý các tùy chọn đăng nhập, bảo vệ thông tin cá nhân và thay đổi mật khẩu của bạn.</p>

        <div className="space-y-6">
          {/* Card: Email Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm">Địa chỉ email đăng nhập</h3>
              <p className="text-sm text-slate-700 mt-1 font-semibold">{user.email}</p>
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs mt-2 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã xác minh</span>
              </div>
            </div>
          </div>

          {/* Card: Reset Password */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">Mật khẩu</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isOauth
                    ? "Tài khoản của bạn được liên kết trực tiếp qua Google/Facebook. Bạn không cần mật khẩu riêng."
                    : "Cập nhật mật khẩu thường xuyên để tăng cường bảo mật."}
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm font-semibold mb-4 ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {!isOauth && (
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={handleResetPassword}
                  disabled={sending}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gửi email đặt lại mật khẩu
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getPublicSiteOrigin(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredSiteUrl) {
    return new URL(configuredSiteUrl).origin;
  }

  return window.location.origin;
}
