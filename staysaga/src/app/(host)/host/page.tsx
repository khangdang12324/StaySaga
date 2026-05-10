import { Home, Calendar, DollarSign, Settings, Bell, Star } from 'lucide-react'

export default function HostDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Trang dành cho Chủ nhà (Host)</h1>
            <p className="text-gray-500 mt-2">Chào mừng trở lại! Hôm nay bạn có 2 lượt đặt phòng mới cần xác nhận.</p>
          </div>
          <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform">
            + Đăng chỗ ở mới
          </button>
        </div>

        {/* PMS (Property Management System) Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <DollarSign className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="text-gray-500 font-medium">Thu nhập tháng này</h3>
            <p className="text-3xl font-black mt-1">45.000.000đ</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Calendar className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-gray-500 font-medium">Tỷ lệ lấp đầy</h3>
            <p className="text-3xl font-black mt-1">78%</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Star className="w-8 h-8 text-amber-500 mb-4" />
            <h3 className="text-gray-500 font-medium">Đánh giá trung bình</h3>
            <p className="text-3xl font-black mt-1">4.92</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <Bell className="w-8 h-8 text-rose-500 mb-4" />
            <h3 className="text-gray-500 font-medium">Yêu cầu chưa đọc</h3>
            <p className="text-3xl font-black mt-1">4</p>
          </div>
        </div>

        {/* Danh sách phòng quản lý */}
        <h2 className="text-2xl font-bold mb-6">Chỗ ở của bạn (Listing)</h2>
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500">Tên chỗ ở</th>
                <th className="px-6 py-4 font-bold text-gray-500">Trạng thái</th>
                <th className="px-6 py-4 font-bold text-gray-500">Giá gốc / đêm</th>
                <th className="px-6 py-4 font-bold text-gray-500">Lịch block ngày</th>
                <th className="px-6 py-4 font-bold text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold">Biệt thự biển ngắm hoàng hôn</td>
                <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Đang mở bán</span></td>
                <td className="px-6 py-4 font-medium">2.500.000đ</td>
                <td className="px-6 py-4"><button className="underline text-blue-600 font-medium">Quản lý lịch (iCal)</button></td>
                <td className="px-6 py-4"><button className="underline text-gray-500">Chỉnh sửa</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
