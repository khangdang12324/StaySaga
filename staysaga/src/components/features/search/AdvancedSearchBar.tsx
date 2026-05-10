'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react'

export function AdvancedSearchBar() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Build query params
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests > 1) params.set('guests', guests.toString())
    
    router.push(`/homestays?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-full shadow-2xl p-2 border border-gray-100 dark:border-zinc-800 relative z-20">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-zinc-800">
        
        {/* Địa điểm */}
        <div className="flex-1 w-full px-6 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full cursor-pointer transition-colors group relative">
          <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Địa điểm</label>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-rose-500 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Bạn muốn đi đâu?" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 font-medium truncate"
            />
          </div>
        </div>

        {/* Ngày nhận - trả */}
        <div className="flex-[1.5] w-full px-6 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full cursor-pointer transition-colors">
          <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Nhận - Trả phòng</label>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="flex items-center gap-2 w-full text-sm font-medium">
              <input 
                type="text" 
                placeholder="Nhận phòng"
                onFocus={(e) => e.target.type = 'date'}
                onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:dark:filter [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
              <span className="text-gray-300">-</span>
              <input 
                type="text" 
                placeholder="Trả phòng"
                onFocus={(e) => e.target.type = 'date'}
                onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white cursor-pointer w-full [&::-webkit-calendar-picker-indicator]:dark:filter [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>
          </div>
        </div>

        {/* Số khách & Submit */}
        <div className="flex-1 w-full pl-6 pr-2 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-between">
          <div className="flex-1 cursor-pointer">
            <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Khách</label>
            <div className="flex items-center">
              <Users className="w-4 h-4 text-rose-500 mr-2 shrink-0" />
              <select 
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white font-medium cursor-pointer w-full appearance-none"
              >
                <option value={1} className="text-gray-900">1 khách</option>
                <option value={2} className="text-gray-900">2 khách</option>
                <option value={3} className="text-gray-900">3 khách</option>
                <option value={4} className="text-gray-900">4+ khách</option>
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            className="ml-4 bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

      </form>
    </div>
  )
}
