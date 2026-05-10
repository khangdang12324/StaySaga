import Navbar from '@/components/layout/Navbar'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function BookingSuccessPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-gray-100 dark:border-zinc-800">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Đặt phòng thành công!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Mã đặt phòng của bạn là <span className="font-mono font-bold text-gray-900 dark:text-white">#BK-{Math.floor(Math.random() * 10000)}</span>. 
            Chúng tôi đã gửi email xác nhận chi tiết lịch trình.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/bookings" 
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl transition-all"
            >
              Xem chuyến đi của tôi
            </Link>
            <Link 
              href="/" 
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-bold py-4 rounded-xl transition-all"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
