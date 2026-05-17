"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, Shield, Globe, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    locale: "vi",
    currency: "VND",
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const savedSettings = session.user.user_metadata?.settings || {};
      setSettings({
        emailNotifications: savedSettings.emailNotifications ?? true,
        pushNotifications: savedSettings.pushNotifications ?? false,
        locale: savedSettings.locale ?? "vi",
        currency: savedSettings.currency ?? "VND",
      });
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { settings },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Da luu cai dat." });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-28 pb-20 max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Cài đặt</h1>

        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900">Thông báo</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Thông báo Email</p>
                  <p className="text-sm text-gray-500">
                    Nhận thông tin về đặt phòng, khuyến mãi
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        emailNotifications: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Thông báo đẩy</p>
                  <p className="text-sm text-gray-500">
                    Nhận thông báo trực tiếp trên trình duyệt
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        pushNotifications: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900">Bảo mật</h3>
            </div>
            <Link
              href="/forgot-password"
              className="block w-full text-left px-4 py-3 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Đổi mật khẩu</p>
              <p className="text-sm text-gray-500">
                Cập nhật mật khẩu tài khoản của bạn
              </p>
            </Link>
          </div>

          {/* Language */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900">Ngôn ngữ & Tiền tệ</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Ngôn ngữ
                </label>
                <select
                  value={settings.locale}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, locale: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Tiền tệ
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                >
                  <option value="VND">VND (₫)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {message && (
                <p
                  className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {message.text}
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Dang luu..." : "Luu cai dat"}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-red-600">Vùng nguy hiểm</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Xóa tài khoản vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
            <button className="px-6 py-2.5 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm">
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
