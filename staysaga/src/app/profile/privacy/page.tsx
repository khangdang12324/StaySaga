"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, ChevronLeft, Download, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { createPrivacyRequestAction } from "@/core/profile/profileActions";

export default function PrivacyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const handleRequest = async (type: "DOWNLOAD_DATA" | "DELETE_ACCOUNT") => {
    const confirmMessage =
      type === "DOWNLOAD_DATA"
        ? "Yêu cầu tải xuống toàn bộ dữ liệu cá nhân của bạn tại StaySaga?"
        : "Cảnh báo: Yêu cầu xóa tài khoản sẽ được gửi đến Ban Quản Trị duyệt. Tài khoản sẽ KHÔNG bị xóa ngay lập tức. Bạn chắc chắn muốn gửi yêu cầu?";

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);
    setMessage(null);

    const res = await createPrivacyRequestAction(type);

    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      const successText =
        type === "DOWNLOAD_DATA"
          ? "Yêu cầu tải dữ liệu cá nhân đã được ghi nhận. Bản sao dữ liệu sẽ được gửi đến email đăng ký của bạn trong vòng 24 giờ."
          : "Yêu cầu xóa tài khoản của bạn đã được gửi thành công. Ban Quản Trị sẽ xử lý và liên hệ xác nhận trong vòng 3 ngày làm việc.";

      setMessage({ type: "success", text: successText });
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

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Quyền riêng tư & Dữ liệu</h1>
        <p className="text-slate-500 text-sm mb-8">Kiểm soát cách dữ liệu cá nhân của bạn được quản lý và bảo vệ tại hệ thống StaySaga.</p>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold mb-6 ${
              message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Box 1: Download Personal Data */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tải xuống dữ liệu cá nhân</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Yêu cầu trích xuất toàn bộ dữ liệu lịch sử đặt phòng, đánh giá, danh sách yêu thích và thông tin cá nhân của bạn.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRequest("DOWNLOAD_DATA")}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 shrink-0"
            >
              Yêu cầu tải về
            </button>
          </div>

          {/* Box 2: Delete Account Request */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Yêu cầu xóa tài khoản</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Xóa tài khoản vĩnh viễn khỏi hệ thống StaySaga. Thao tác này sẽ hủy bỏ cấp thành viên và mọi ưu đãi tặng thưởng đi kèm.
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 text-xs mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <p>
                Để bảo vệ quyền lợi đặt phòng và bảo mật thông tin, Ban Quản Trị StaySaga cần kiểm duyệt và xác minh kỹ trước khi xóa tài khoản. Quá trình này sẽ mất từ 1 - 3 ngày làm việc.
              </p>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => handleRequest("DELETE_ACCOUNT")}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                Gửi yêu cầu xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
