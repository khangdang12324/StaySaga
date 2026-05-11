'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Calendar as CalendarIcon, Users, Minus, Plus, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

/* ===== DATA ===== */
const DESTINATIONS = [
  { name: 'TP. Hồ Chí Minh', count: 2845, image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=200&h=200&fit=crop' },
  { name: 'Hà Nội', count: 1920, image: 'https://images.unsplash.com/photo-1509030450996-dd1a26613e2c?q=80&w=200&h=200&fit=crop' },
  { name: 'Đà Lạt', count: 1356, image: 'https://images.unsplash.com/photo-1552554700-1c3947d6e67e?q=80&w=200&h=200&fit=crop' },
  { name: 'Nha Trang', count: 1124, image: 'https://images.unsplash.com/photo-1558281050-0cb572183204?q=80&w=200&h=200&fit=crop' },
  { name: 'Đà Nẵng', count: 1580, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=200&h=200&fit=crop' },
  { name: 'Phú Quốc', count: 932, image: 'https://images.unsplash.com/photo-1588661605333-f5424dfd414e?q=80&w=200&h=200&fit=crop' },
  { name: 'Hội An', count: 810, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=200&h=200&fit=crop' },
  { name: 'Vũng Tàu', count: 745, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=200&h=200&fit=crop' },
  { name: 'Sapa', count: 645, image: 'https://images.unsplash.com/photo-1543689408-ddc5c16110f6?q=80&w=200&h=200&fit=crop' },
  { name: 'Quy Nhơn', count: 520, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&h=200&fit=crop' },
]

const MONTHS_VN = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/* ===== CALENDAR HELPERS ===== */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

function formatDate(date: Date) {
  const d = date.getDate()
  const m = date.getMonth() + 1
  return `${d} thg ${m}`
}

function formatDateISO(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isInRange(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  return date > start && date < end
}

function isPast(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/* ===== COMPONENT ===== */
export function AdvancedSearchBar() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [locationInput, setLocationInput] = useState('')

  // Calendar state
  const [checkInDate, setCheckInDate] = useState<Date | null>(null)
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null)
  const [calendarBaseMonth, setCalendarBaseMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Guests state
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [rooms, setRooms] = useState(1)

  // Panel states
  const [activePanel, setActivePanel] = useState<'location' | 'calendar' | 'guests' | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePanel(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter destinations
  const filteredDestinations = locationInput.trim()
    ? DESTINATIONS.filter(d => d.name.toLowerCase().includes(locationInput.toLowerCase()))
    : DESTINATIONS

  // Calendar month2
  const month2 = useMemo(() => {
    let m = calendarBaseMonth.month + 1
    let y = calendarBaseMonth.year
    if (m > 11) { m = 0; y++ }
    return { year: y, month: m }
  }, [calendarBaseMonth])

  const handleSelectCity = (name: string) => {
    setLocation(name)
    setLocationInput(name)
    setActivePanel('calendar') // auto-open calendar
  }

  const handleDayClick = (date: Date) => {
    if (isPast(date)) return

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection
      setCheckInDate(date)
      setCheckOutDate(null)
    } else {
      // Set checkout
      if (date <= checkInDate) {
        setCheckInDate(date)
        setCheckOutDate(null)
      } else {
        setCheckOutDate(date)
        // Auto-open guests after selecting dates
        setTimeout(() => setActivePanel('guests'), 300)
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (checkInDate) params.set('checkIn', formatDateISO(checkInDate))
    if (checkOutDate) params.set('checkOut', formatDateISO(checkOutDate))
    const totalGuests = adults + children
    if (totalGuests > 1) params.set('guests', totalGuests.toString())
    if (rooms > 1) params.set('rooms', rooms.toString())
    router.push(`/homestays?${params.toString()}`)
  }

  const prevMonth = () => {
    const now = new Date()
    const currentMonthKey = now.getFullYear() * 12 + now.getMonth()
    const baseMonthKey = calendarBaseMonth.year * 12 + calendarBaseMonth.month
    if (baseMonthKey > currentMonthKey) {
      let m = calendarBaseMonth.month - 1
      let y = calendarBaseMonth.year
      if (m < 0) { m = 11; y-- }
      setCalendarBaseMonth({ year: y, month: m })
    }
  }

  const nextMonth = () => {
    let m = calendarBaseMonth.month + 1
    let y = calendarBaseMonth.year
    if (m > 11) { m = 0; y++ }
    setCalendarBaseMonth({ year: y, month: m })
  }

  // Display strings
  const guestSummary = `${adults} người lớn · ${children} trẻ em · ${rooms} phòng`

  const dateDisplay = checkInDate
    ? checkOutDate
      ? `${formatDate(checkInDate)} — ${formatDate(checkOutDate)}`
      : `${formatDate(checkInDate)} — Chọn trả phòng`
    : 'Chọn ngày'

  const nightsCount = checkInDate && checkOutDate
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto relative z-20 px-4 md:px-0">
      {/* ===== SEARCH BAR — Senior Minimalist Design ===== */}
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl md:rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.18)] p-2 md:p-3 border border-white/40 dark:border-white/5">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center">

          {/* LOCATION */}
          <div
            onClick={() => {
              setActivePanel('location')
              setTimeout(() => inputRef.current?.focus(), 50)
            }}
            className={`flex-[1.2] px-6 py-4 md:py-6 rounded-[28px] md:rounded-l-[32px] cursor-pointer transition-all flex items-center group ${activePanel === 'location' ? 'bg-gray-100/50 dark:bg-white/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
          >
            <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] leading-none mb-1.5 block">Địa điểm</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Tìm điểm đến..."
                value={locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value)
                  setLocation(e.target.value)
                  setActivePanel('location')
                }}
                onFocus={() => setActivePanel('location')}
                className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 font-bold text-base md:text-lg truncate"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-gray-200 dark:bg-white/10 mx-2" />

          {/* DATES */}
          <div
            onClick={() => setActivePanel('calendar')}
            className={`flex-1 px-6 py-4 md:py-6 rounded-[28px] md:rounded-none cursor-pointer transition-all flex items-center group ${activePanel === 'calendar' ? 'bg-gray-100/50 dark:bg-white/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
          >
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] leading-none mb-1.5 block">Thời gian</label>
              <span className={`block font-bold text-base md:text-lg truncate ${checkInDate ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                {dateDisplay}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-gray-200 dark:bg-white/10 mx-2" />

          {/* GUESTS */}
          <div
            onClick={() => setActivePanel(activePanel === 'guests' ? null : 'guests')}
            className={`flex-1 px-6 py-4 md:py-6 rounded-[28px] md:rounded-none cursor-pointer transition-all flex items-center group ${activePanel === 'guests' ? 'bg-amber-50 dark:bg-amber-900/30' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'}`}
            style={activePanel === 'guests' ? { backgroundColor: 'transparent' } : {}}
          >
            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] leading-none mb-1.5 block">Khách hàng</label>
              <span className="block text-gray-900 dark:text-white font-bold text-base md:text-lg truncate">{adults + children} khách</span>
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <button
            type="submit"
            className="md:w-auto bg-rose-600 hover:bg-rose-700 text-white px-10 py-5 md:py-6 rounded-[28px] md:rounded-r-[32px] font-black text-lg transition-all shadow-2xl shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] shrink-0 mt-2 md:mt-0 flex items-center justify-center gap-3"
          >
            <Search className="w-6 h-6 stroke-[3]" />
            <span>Tìm kiếm</span>
          </button>
        </form>
      </div>

      {/* ===== PANELS ===== */}

      {/* LOCATION PANEL — Agoda style grid */}
      {activePanel === 'location' && (
        <div className="absolute top-full md:top-full left-0 right-0 mt-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50" style={{ animation: 'fadeSlideIn 200ms ease-out' }}>
          <div className="p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {locationInput.trim() ? '🔍 Kết quả tìm kiếm' : '🔥 Điểm đến thịnh hành'}
            </h3>

            {filteredDestinations.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
                {filteredDestinations.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleSelectCity(dest.name)}
                    className="group flex flex-col items-center text-center p-2 md:p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all hover:shadow-md cursor-pointer"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden mb-2 ring-2 ring-transparent group-hover:ring-blue-500 transition-all shadow-sm">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="font-semibold text-[10px] md:text-sm text-gray-900 dark:text-white leading-tight truncate w-full">{dest.name}</p>
                    <p className="text-[9px] md:text-xs text-gray-400 mt-0.5">{dest.count.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-10 text-gray-400">
                <MapPin className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm md:text-base">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALENDAR PANEL */}
      {activePanel === 'calendar' && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50" style={{ animation: 'fadeSlideIn 200ms ease-out' }}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 overflow-y-auto max-h-[60vh] md:max-h-none">
              <MonthGrid
                year={calendarBaseMonth.year}
                month={calendarBaseMonth.month}
                checkIn={checkInDate}
                checkOut={checkOutDate}
                onDayClick={handleDayClick}
              />
              <div className="hidden md:block">
                <MonthGrid
                  year={month2.year}
                  month={month2.month}
                  checkIn={checkInDate}
                  checkOut={checkOutDate}
                  onDayClick={handleDayClick}
                />
              </div>
            </div>

            {checkInDate && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <div className="text-xs md:text-sm text-gray-500 truncate">
                  {checkOutDate ? (
                    <span>
                      <strong className="text-gray-900 dark:text-white">{formatDate(checkInDate)}</strong> → <strong className="text-gray-900 dark:text-white">{formatDate(checkOutDate)}</strong>
                    </span>
                  ) : (
                    <span>Nhận: <strong className="text-gray-900 dark:text-white">{formatDate(checkInDate)}</strong></span>
                  )}
                </div>
                {checkOutDate && (
                  <button
                    type="button"
                    onClick={() => setActivePanel('guests')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 md:px-6 py-2 rounded-xl transition-colors text-xs md:text-sm shrink-0"
                  >
                    Tiếp tục
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GUEST PANEL */}
      {activePanel === 'guests' && (
        <div className="absolute top-full right-0 mt-3 w-full md:w-[340px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-4 md:p-5 z-50" style={{ animation: 'fadeSlideIn 200ms ease-out' }}>
          <GuestRow label="Người lớn" desc="Từ 13 tuổi" value={adults} min={1} max={16} onChange={setAdults} />
          <GuestRow label="Trẻ em" desc="0 – 12 tuổi" value={children} min={0} max={10} onChange={setChildren} />
          <GuestRow label="Phòng" desc="Số phòng" value={rooms} min={1} max={8} onChange={setRooms} isLast />
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Xong
          </button>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ===== MONTH GRID COMPONENT ===== */
function MonthGrid({
  year, month, checkIn, checkOut, onDayClick
}: {
  year: number; month: number
  checkIn: Date | null; checkOut: Date | null
  onDayClick: (date: Date) => void
}) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <h4 className="text-center font-bold text-gray-900 dark:text-white mb-3 text-base">
        {MONTHS_VN[month]} {year}
      </h4>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_VN.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1.5">{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />

          const date = new Date(year, month, day)
          const past = isPast(date)
          const isCheckIn = isSameDay(date, checkIn)
          const isCheckOut = isSameDay(date, checkOut)
          const inRange = isInRange(date, checkIn, checkOut)
          const isToday = isSameDay(date, new Date())

          let classes = 'relative h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all cursor-pointer '

          if (past) {
            classes += 'text-gray-300 dark:text-zinc-700 cursor-not-allowed '
          } else if (isCheckIn || isCheckOut) {
            classes += 'bg-rose-600 text-white font-bold shadow-sm '
          } else if (inRange) {
            classes += 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 '
          } else if (isToday) {
            classes += 'ring-2 ring-rose-500 text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 '
          } else {
            classes += 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 '
          }

          return (
            <button
              key={day}
              type="button"
              disabled={past}
              onClick={() => onDayClick(date)}
              className={classes}
            >
              {day}
              {isCheckIn && checkOut && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-200 whitespace-nowrap">nhận</span>
              )}
              {isCheckOut && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-200 whitespace-nowrap">trả</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ===== GUEST ROW ===== */
function GuestRow({
  label, desc, value, min, max, onChange, isLast = false
}: {
  label: string; desc: string; value: number; min: number; max: number
  onChange: (v: number) => void; isLast?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 rounded-full border border-gray-300 dark:border-zinc-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-rose-500 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-bold text-gray-900 dark:text-white text-lg">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 rounded-full border border-gray-300 dark:border-zinc-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-rose-500 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
