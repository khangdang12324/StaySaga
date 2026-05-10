'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { differenceInDays } from 'date-fns'
import { getPropertyBySlug } from '../properties/actions' // We will use this to re-verify price

export type CreateBookingPayload = {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
  paymentMethod: string
}

/**
 * Xử lý tạo Booking mới với cơ chế Pessimistic Validation
 */
export async function createBooking(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Kiểm tra xác thực User
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    // Lưu lại URL đang đứng để redirect về sau khi đăng nhập (nâng cao)
    redirect('/login')
  }

  const propertyId = formData.get('propertyId') as string
  const checkIn = formData.get('checkIn') as string
  const checkOut = formData.get('checkOut') as string
  const guests = parseInt(formData.get('guests') as string)
  const paymentMethod = formData.get('paymentMethod') as string
  const slug = formData.get('slug') as string

  // 2. Fetch lại giá phòng từ DB (KHÔNG BAO GIỜ TIN TƯỞNG GIÁ TỪ CLIENT GỬI LÊN)
  const { data: property, isMock } = await getPropertyBySlug(slug || propertyId) // Fallback for mock
  if (!property) {
    return { error: 'Không tìm thấy chỗ ở này.' }
  }

  // 3. Tính toán lại giá tiền ở Server
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const days = differenceInDays(end, start)
  if (days <= 0) return { error: 'Ngày nhận và trả phòng không hợp lệ.' }

  const basePrice = property.price || property.base_price || 0
  const accommodationsCost = basePrice * days
  const cleaningFee = 300000
  const serviceFee = Math.round(accommodationsCost * 0.12)
  const totalAmount = accommodationsCost + cleaningFee + serviceFee

  // 4. KIỂM TRA DOUBLE-BOOKING (Race Condition Prevention)
  if (!isMock) {
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('homestay_id', property.id)
      .in('status', ['PENDING', 'CONFIRMED'])
      .lte('check_in_date', checkOut)
      .gte('check_out_date', checkIn)

    if (overlapError) throw new Error("Database error")
    if (overlappingBookings && overlappingBookings.length > 0) {
      return { error: 'Rất tiếc! Phòng đã có người đặt trong thời gian này. Vui lòng chọn ngày khác.' }
    }
  }

  // 5. Tạo Booking (Trạng thái PENDING)
  if (!isMock) {
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: session.user.id,
        homestay_id: property.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests: guests,
        total_price: totalAmount,
        status: 'PENDING',
      })
      .select()
      .single()

    if (insertError) {
      console.error("Booking insert error:", insertError)
      return { error: 'Lỗi hệ thống khi tạo đơn đặt phòng.' }
    }
  }

  // Chuyển hướng tới cổng thanh toán (Phase 7) hoặc trang thành công
  // Ở hệ thống thực tế, đây là lúc gọi Stripe API tạo PaymentIntent
  // Tạm thời redirect thẳng tới trang Booking Success
  redirect(`/bookings/success?id=${propertyId}&checkIn=${checkIn}`)
}
