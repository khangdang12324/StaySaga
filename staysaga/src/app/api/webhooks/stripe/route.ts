import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // Khởi tạo Supabase Admin Client (Bypass RLS cho Webhook Server-to-Server)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
    )
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature') as string

    // 1. Verify Webhook Signature (Chống giả mạo request từ Hacker)
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    
    // Giả lập lấy event type
    const event = { type: 'checkout.session.completed', data: { object: { metadata: { bookingId: 'BK-123' } } } }

    // 2. Business Logic: Xử lý trạng thái thanh toán
    if (event.type === 'checkout.session.completed') {
      const bookingId = event.data.object.metadata.bookingId
      
      // 3. Cập nhật Database: PENDING -> CONFIRMED
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ 
          status: 'CONFIRMED',
          payment_status: 'PAID',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      // 4. Bắn sự kiện lên Message Queue hoặc gửi Email (Phase 11)
      await supabaseAdmin.from('notifications').insert({
        type: 'BOOKING_CONFIRMED',
        message: `Booking ${bookingId} has been paid successfully.`,
        booking_id: bookingId
      })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }
}
