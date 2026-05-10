'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInDays } from 'date-fns'

interface BookingWidgetProps {
  propertyId: string
  basePrice: number
}

export function BookingWidget({ propertyId, basePrice }: BookingWidgetProps) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState<string>('')
  const [checkOut, setCheckOut] = useState<string>('')
  const [guests, setGuests] = useState<number>(1)

  // Enterprise Business Logic: Dynamic Pricing Calculation
  const { totalDays, accommodationsCost, cleaningFee, serviceFee, totalAmount } = useMemo(() => {
    let days = 0
    if (checkIn && checkOut) {
      const start = new Date(checkIn)
      const end = new Date(checkOut)
      days = differenceInDays(end, start)
      if (days < 0) days = 0
    }

    const cost = days > 0 ? basePrice * days : basePrice
    // Phí dọn dẹp cố định
    const cleaning = 300000 
    // Nền tảng thu phí dịch vụ 12% trên giá gốc
    const service = Math.round(cost * 0.12) 
    
    return {
      totalDays: days || 1,
      accommodationsCost: cost,
      cleaningFee: cleaning,
      serviceFee: service,
      totalAmount: cost + cleaning + service
    }
  }, [checkIn, checkOut, basePrice])

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      alert("Vui lòng chọn ngày nhận và trả phòng hợp lệ!")
      return
    }
    // Chuyển hướng sang trang thanh toán kèm tham số (thực tế sẽ gọi Server Action để tạo bản ghi PENDING)
    const params = new URLSearchParams({
      propertyId,
      checkIn,
      checkOut,
      guests: guests.toString(),
      totalAmount: totalAmount.toString()
    })
    router.push(`/checkout/${propertyId}?${params.toString()}`)
  }

  return (
    <div className="sticky top-28 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl z-10">
      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-2xl font-black text-rose-600">{basePrice.toLocaleString('vi-VN')}đ</span>
        <span className="text-gray-500">/ đêm</span>
      </div>

      <div className="border border-gray-300 dark:border-zinc-700 rounded-xl overflow-hidden mb-6">
        <div className="flex border-b border-gray-300 dark:border-zinc-700">
          <div className="flex-1 p-3 border-r border-gray-300 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <label className="text-xs font-bold uppercase block w-full cursor-pointer">Nhận phòng</label>
            <input 
              type="date" 
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent border-none outline-none mt-1 text-sm font-medium cursor-pointer" 
            />
          </div>
          <div className="flex-1 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <label className="text-xs font-bold uppercase block w-full cursor-pointer">Trả phòng</label>
            <input 
              type="date" 
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent border-none outline-none mt-1 text-sm font-medium cursor-pointer" 
            />
          </div>
        </div>
        <div className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
          <label className="text-xs font-bold uppercase block w-full cursor-pointer">Khách</label>
          <select 
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent border-none outline-none mt-1 text-sm font-medium cursor-pointer"
          >
            {[1,2,3,4,5,6,7,8].map(n => (
              <option key={n} value={n} className="text-gray-900">{n} khách</option>
            ))}
          </select>
        </div>
      </div>

      <button 
        onClick={handleBooking}
        className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg mb-4"
      >
        Đặt phòng ngay
      </button>
      <p className="text-center text-gray-500 text-sm mb-6">Bạn vẫn chưa bị trừ tiền</p>

      {/* Phân tích giá (Pricing Breakdown) - Ẩn nếu chưa chọn ngày */}
      {checkIn && checkOut && (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-800 pb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between">
            <span className="underline">{basePrice.toLocaleString('vi-VN')}đ x {totalDays} đêm</span>
            <span>{accommodationsCost.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="underline">Phí dọn dẹp</span>
            <span>{cleaningFee.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="underline">Phí dịch vụ StaySaga</span>
            <span>{serviceFee.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>
      )}

      <div className="flex justify-between font-black text-lg pt-6 text-gray-900 dark:text-white">
        <span>Tổng cộng</span>
        <span className="text-rose-600">{totalAmount.toLocaleString('vi-VN')}đ</span>
      </div>
    </div>
  )
}
