import { Home, Users, Calendar, DollarSign, Settings, BarChart } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <span className="text-2xl font-black text-rose-600">StaySaga.</span>
          <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded ml-2">ADMIN</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin" className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-800 px-4 py-3 rounded-xl font-medium text-gray-900 dark:text-white"><BarChart className="w-5 h-5"/> Tổng quan</Link>
          <Link href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium"><Home className="w-5 h-5"/> Homestays</Link>
          <Link href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium"><Calendar className="w-5 h-5"/> Đơn đặt phòng</Link>
          <Link href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium"><Users className="w-5 h-5"/> Khách hàng</Link>
          <Link href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 px-4 py-3 rounded-xl font-medium"><Settings className="w-5 h-5"/> Cài đặt</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Tổng quan Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-500">Doanh thu</h3>
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign className="w-5 h-5"/></div>
            </div>
            <p className="text-2xl font-bold">124.500.000đ</p>
            <p className="text-sm text-green-600 font-medium mt-2">+12% so với tháng trước</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-500">Đơn đặt mới</h3>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar className="w-5 h-5"/></div>
            </div>
            <p className="text-2xl font-bold">45</p>
            <p className="text-sm text-blue-600 font-medium mt-2">+5% so với tháng trước</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-500">Homestay đang mở</h3>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Home className="w-5 h-5"/></div>
            </div>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-500">Người dùng mới</h3>
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users className="w-5 h-5"/></div>
            </div>
            <p className="text-2xl font-bold">128</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <h2 className="font-bold text-lg">Đơn đặt phòng gần đây</h2>
            <button className="text-rose-600 text-sm font-medium">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 text-sm">
                  <th className="px-6 py-3 font-medium">Mã đơn</th>
                  <th className="px-6 py-3 font-medium">Khách hàng</th>
                  <th className="px-6 py-3 font-medium">Homestay</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm">
                <tr>
                  <td className="px-6 py-4 font-mono font-medium">#BK-9281</td>
                  <td className="px-6 py-4">Nguyễn Văn A</td>
                  <td className="px-6 py-4">Biệt thự biển ngắm hoàng hôn</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-semibold text-xs">Đã thanh toán</span></td>
                  <td className="px-6 py-4 font-medium">14.300.000đ</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono font-medium">#BK-9282</td>
                  <td className="px-6 py-4">Trần Thị B</td>
                  <td className="px-6 py-4">Cabin gỗ giữa đồi thông</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-semibold text-xs">Chờ xác nhận</span></td>
                  <td className="px-6 py-4 font-medium">4.200.000đ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
