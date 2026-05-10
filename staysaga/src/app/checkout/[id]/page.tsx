import { ChevronLeft, Star } from 'lucide-react'
import Link from 'next/link'
import { getPropertyBySlug } from '@/core/properties/actions'
import { createBooking } from '@/core/bookings/actions'
import { differenceInDays, format } from 'date-fns'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  // Lấy dữ liệu từ URL truyền từ BookingWidget
  const checkIn = resolvedSearchParams.checkIn
  const checkOut = resolvedSearchParams.checkOut
  const guests = resolvedSearchParams.guests ? parseInt(resolvedSearchParams.guests) : 1

  if (!checkIn || !checkOut) {
    redirect(`/homestays/${resolvedParams.id}`)
  }

  // Fetch Property & Xác thực lại giá (Bảo mật)
  const { data: property } = await getPropertyBySlug(resolvedParams.id)
  
  if (!property) {
    return notFound()
  }

  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const days = differenceInDays(end, start)
  
  const basePrice = property.price || property.base_price || 0
  const accommodationsCost = basePrice * days
  const cleaningFee = 300000
  const serviceFee = Math.round(accommodationsCost * 0.12)
  const totalAmount = accommodationsCost + cleaningFee + serviceFee

  const mainImage = property.image || property.images?.[0]?.url || 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=400'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/homestays/${property.slug}`} className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-8 hover:bg-gray-100 dark:hover:bg-zinc-800 p-2 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5" /> Trở về chỗ ở
        </Link>
        <h1 className="text-4xl font-extrabold mb-12">Xác nhận và Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Cột Form thanh toán & Thông tin chuyến đi */}
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-6">Chuyến đi của bạn</h2>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Ngày</h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {format(start, 'dd/MM/yyyy')} - {format(end, 'dd/MM/yyyy')}
                  </p>
                </div>
                <Link href={`/homestays/${property.slug}`} className="font-bold underline text-rose-600 hover:text-rose-700">Chỉnh sửa</Link>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">Khách</h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{guests} khách</p>
                </div>
                <Link href={`/homestays/${property.slug}`} className="font-bold underline text-rose-600 hover:text-rose-700">Chỉnh sửa</Link>
              </div>
            </section>

            <hr className="border-gray-200 dark:border-zinc-800" />

            <form action={createBooking} className="space-y-10">
              {/* Hidden Inputs truyền dữ liệu cho Server Action */}
              <input type="hidden" name="propertyId" value={property.id} />
              <input type="hidden" name="slug" value={property.slug} />
              <input type="hidden" name="checkIn" value={checkIn} />
              <input type="hidden" name="checkOut" value={checkOut} />
              <input type="hidden" name="guests" value={guests} />

              <section>
                <h2 className="text-2xl font-bold mb-6">Chọn phương thức thanh toán</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-rose-600 transition-colors bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="paymentMethod" value="CREDIT_CARD" className="w-5 h-5 text-rose-600" defaultChecked />
                      <span className="font-semibold text-lg">Thẻ Tín dụng / Ghi nợ (Stripe)</span>
                    </div>
                    <div className="text-2xl">💳</div>
                  </label>
                  <label className="flex items-center justify-between p-4 border border-gray-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-rose-600 transition-colors bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="paymentMethod" value="VNPAY" className="w-5 h-5 text-rose-600" />
                      <span className="font-semibold text-lg">Ví VNPay / Momo</span>
                    </div>
                    <div className="text-2xl">📱</div>
                  </label>
                </div>
              </section>

              <hr className="border-gray-200 dark:border-zinc-800" />

              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-5 rounded-xl text-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                Xác nhận thanh toán {totalAmount.toLocaleString('vi-VN')}đ
              </button>
            </form>
          </div>

          {/* Cột Chi tiết giá (Sticky) */}
          <div>
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl sticky top-28 shadow-xl">
              <div className="flex gap-4 pb-6 border-b border-gray-200 dark:border-zinc-800">
                <img src={mainImage} className="w-32 h-24 object-cover rounded-xl shadow-sm" alt="Room" />
                <div className="flex flex-col justify-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Toàn bộ chỗ ở</span>
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm mt-2 font-medium">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 
                    {property.rating || '4.9'} ({property.reviews || 128} đánh giá)
                  </div>
                </div>
              </div>

              <div className="py-6 border-b border-gray-200 dark:border-zinc-800 space-y-4">
                <h3 className="font-bold text-xl mb-4">Chi tiết giá</h3>
                <div className="flex justify-between text-gray-600 dark:text-gray-300 font-medium">
                  <span>{basePrice.toLocaleString('vi-VN')}đ x {days} đêm</span>
                  <span>{accommodationsCost.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300 font-medium">
                  <span>Phí dọn dẹp</span>
                  <span>{cleaningFee.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300 font-medium">
                  <span>Phí dịch vụ StaySaga</span>
                  <span>{serviceFee.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center text-xl font-black">
                <span>Tổng (VND)</span>
                <span className="text-rose-600">{totalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
