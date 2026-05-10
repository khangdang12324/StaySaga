import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarCheck, MapPin, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  // Fetch bookings from DB
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, homestay:homestays(name, slug, city, homestay_images(url))')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const hasBookings = bookings && bookings.length > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-28 pb-20 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Đặt phòng & Chuyến đi</h1>
        <p className="text-gray-500 mb-8">Quản lý tất cả lịch trình du lịch của bạn tại đây.</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-zinc-800">
          <button className="px-5 py-3 text-sm font-bold text-rose-600 border-b-2 border-rose-600">Sắp tới</button>
          <button className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">Đã hoàn thành</button>
          <button className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">Đã hủy</button>
        </div>

        {hasBookings ? (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <div key={booking.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-32 md:h-auto">
                    <img 
                      src={booking.homestay?.homestay_images?.[0]?.url || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=500'} 
                      alt={booking.homestay?.name || 'Homestay'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{booking.homestay?.name || 'Homestay'}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {booking.homestay?.city || 'Việt Nam'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {booking.status === 'CONFIRMED' ? 'Đã xác nhận' : 
                         booking.status === 'PENDING' ? 'Chờ thanh toán' : 
                         booking.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn thành'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><CalendarCheck className="w-4 h-4" /> {booking.check_in_date} → {booking.check_out_date}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{Number(booking.total_price).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800">
            <CalendarCheck className="w-16 h-16 text-gray-200 dark:text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có chuyến đi nào</h2>
            <p className="text-gray-500 mb-6">Bắt đầu khám phá và đặt chỗ ở cho chuyến đi tiếp theo!</p>
            <Link href="/homestays" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md inline-block">
              Khám phá Homestays
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
