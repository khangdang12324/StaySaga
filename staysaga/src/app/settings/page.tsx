import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Bell, Shield, Globe, Moon, Trash2 } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Cài đặt</h1>

        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Thông báo</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Thông báo Email</p>
                  <p className="text-sm text-gray-500">Nhận thông tin về đặt phòng, khuyến mãi</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Thông báo đẩy</p>
                  <p className="text-sm text-gray-500">Nhận thông báo trực tiếp trên trình duyệt</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Bảo mật</h3>
            </div>
            <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <p className="font-medium text-gray-900 dark:text-white">Đổi mật khẩu</p>
              <p className="text-sm text-gray-500">Cập nhật mật khẩu tài khoản của bạn</p>
            </button>
          </div>

          {/* Language */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Ngôn ngữ & Tiền tệ</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Ngôn ngữ</label>
                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none">
                  <option>🇻🇳 Tiếng Việt</option>
                  <option>🇺🇸 English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tiền tệ</label>
                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none">
                  <option>VND (₫)</option>
                  <option>USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-red-600">Vùng nguy hiểm</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Xóa tài khoản vĩnh viễn. Hành động này không thể hoàn tác.</p>
            <button className="px-6 py-2.5 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm">
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
