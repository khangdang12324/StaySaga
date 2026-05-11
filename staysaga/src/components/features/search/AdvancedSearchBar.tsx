"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ===== DATA ===== */
const DESTINATIONS = [
  {
    name: "TP. Hồ Chí Minh",
    count: 2845,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=200&h=200&fit=crop",
  },
  {
    name: "Hà Nội",
    count: 1920,
    image:
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210a7?q=80&w=200&h=200&fit=crop",
  },
  {
    name: "Đà Lạt",
    count: 1356,
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=200&h=200&fit=crop",
  },
  {
    name: "Nha Trang",
    count: 1124,
    image:
      "https://images.unsplash.com/photo-1560067174-89451c3b89f2?q=80&w=200&h=200&fit=crop",
  },
  {
    name: "Đà Nẵng",
    count: 1580,
    image:
      "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?q=80&w=200&h=200&fit=crop",
  },
];

const MONTHS_VN = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const DAYS_VN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/* ===== CALENDAR HELPERS ===== */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDate(date: Date) {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  return `${d} thg ${m}`;
}

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  return date > start && date < end;
}

function isPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/* ===== COMPONENT ===== */
export function AdvancedSearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // Calendar state
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [calendarBaseMonth, setCalendarBaseMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Guests state
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // Panel states
  const [activePanel, setActivePanel] = useState<
    "location" | "calendar" | "guests" | null
  >(null);
  const [formError, setFormError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActivePanel(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter destinations
  const filteredDestinations = locationInput.trim()
    ? DESTINATIONS.filter((d) =>
        d.name.toLowerCase().includes(locationInput.toLowerCase()),
      )
    : DESTINATIONS;

  // Calendar month2
  const month2 = useMemo(() => {
    let m = calendarBaseMonth.month + 1;
    let y = calendarBaseMonth.year;
    if (m > 11) {
      m = 0;
      y++;
    }
    return { year: y, month: m };
  }, [calendarBaseMonth]);

  const handleSelectCity = (name: string) => {
    setLocation(name);
    setLocationInput(name);
    setFormError(null);
    setActivePanel("calendar"); // auto-open calendar
  };

  const handleDayClick = (date: Date) => {
    if (isPast(date)) return;

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection
      setCheckInDate(date);
      setCheckOutDate(null);
    } else {
      // Set checkout
      if (date <= checkInDate) {
        setCheckInDate(date);
        setCheckOutDate(null);
      } else {
        setCheckOutDate(date);
        setFormError(null);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) {
      setFormError("Vui lòng nhập điểm đến.");
      setActivePanel("location");
      return;
    }
    setFormError(null);
    const params = new URLSearchParams();
    const locationValue = locationInput.trim();
    if (locationValue) params.set("location", locationValue);
    if (checkInDate && checkOutDate) {
      params.set("checkIn", formatDateISO(checkInDate));
      params.set("checkOut", formatDateISO(checkOutDate));
    }
    const totalGuests = adults + children;
    if (totalGuests > 1) params.set("guests", totalGuests.toString());
    if (rooms > 1) params.set("rooms", rooms.toString());
    router.push(`/homestays?${params.toString()}`);
  };

  const prevMonth = () => {
    const now = new Date();
    const currentMonthKey = now.getFullYear() * 12 + now.getMonth();
    const baseMonthKey = calendarBaseMonth.year * 12 + calendarBaseMonth.month;
    if (baseMonthKey > currentMonthKey) {
      let m = calendarBaseMonth.month - 1;
      let y = calendarBaseMonth.year;
      if (m < 0) {
        m = 11;
        y--;
      }
      setCalendarBaseMonth({ year: y, month: m });
    }
  };

  const nextMonth = () => {
    let m = calendarBaseMonth.month + 1;
    let y = calendarBaseMonth.year;
    if (m > 11) {
      m = 0;
      y++;
    }
    setCalendarBaseMonth({ year: y, month: m });
  };

  // Display strings
  const guestSummary = `${adults + children} khách · ${rooms} phòng`;

  const dateDisplay = checkInDate
    ? checkOutDate
      ? `${formatDate(checkInDate)} — ${formatDate(checkOutDate)}`
      : `${formatDate(checkInDate)} — Chọn trả phòng`
    : "Check-in - Check-out";

  return (
    <div
      ref={containerRef}
      className="w-full max-w-4xl mx-auto relative z-20 px-4 md:px-0"
    >
      {/* ===== SEARCH BAR — Booking.com style ===== */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-rose-500/70 overflow-hidden">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row text-left"
        >
          <div className="flex flex-col md:flex-row md:flex-1">
            {/* LOCATION */}
            <div
              onClick={() => {
                setActivePanel("location");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className={`flex md:flex-1 items-center gap-3 px-4 py-4 md:py-5 cursor-pointer transition-colors border-b border-gray-200 md:border-b-0 md:border-r ${activePanel === "location" ? "bg-rose-50/70" : "hover:bg-rose-50/50"}`}
            >
              <MapPin className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.18em] leading-none mb-1 block">
                  Điểm đến
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập điểm đến"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setLocation(e.target.value);
                    if (e.target.value.trim()) setFormError(null);
                    setActivePanel("location");
                  }}
                  onFocus={() => setActivePanel("location")}
                  className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 font-semibold text-sm md:text-base truncate"
                />
              </div>
            </div>

            {/* DATES */}
            <div
              onClick={() => setActivePanel("calendar")}
              className={`flex md:flex-1 items-center gap-3 px-4 py-4 md:py-5 cursor-pointer transition-colors border-b border-gray-200 md:border-b-0 md:border-r ${activePanel === "calendar" ? "bg-rose-50/70" : "hover:bg-rose-50/50"}`}
            >
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.18em] leading-none mb-1 block">
                  Ngày
                </label>
                <span
                  className={`block font-semibold text-sm md:text-base truncate ${checkInDate ? "text-gray-900" : "text-gray-400"}`}
                >
                  {dateDisplay}
                </span>
              </div>
            </div>

            {/* GUESTS */}
            <div
              onClick={() =>
                setActivePanel(activePanel === "guests" ? null : "guests")
              }
              className={`flex md:flex-1 items-center gap-3 px-4 py-4 md:py-5 cursor-pointer transition-colors ${activePanel === "guests" ? "bg-rose-50/70" : "hover:bg-rose-50/50"}`}
            >
              <Users className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.18em] leading-none mb-1 block">
                  Khách
                </label>
                <span className="block text-gray-900 font-semibold text-sm md:text-base truncate">
                  {guestSummary}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <div className="border-t border-gray-200 md:border-t-0 md:border-l">
            <button
              type="submit"
              className="w-full md:w-auto md:h-full bg-rose-600 hover:bg-rose-500 text-white px-6 py-4 md:py-5 md:px-8 md:rounded-r-xl font-bold text-base transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>Tìm kiếm</span>
            </button>
          </div>
        </form>
      </div>

      {formError && (
        <div className="mt-2 text-sm text-rose-600">{formError}</div>
      )}

      {/* ===== PANELS ===== */}

      {/* LOCATION PANEL — Booking-style list */}
      {activePanel === "location" && (
        <div
          className="absolute top-full md:top-full left-0 right-0 mt-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50"
          style={{ animation: "fadeSlideIn 200ms ease-out" }}
        >
          <div className="p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {locationInput.trim()
                ? "Kết quả tìm kiếm"
                : "Điểm đến thịnh hành"}
            </h3>

            {filteredDestinations.length > 0 ? (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredDestinations.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleSelectCity(dest.name)}
                    className="w-full flex items-center gap-4 px-2 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {dest.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Việt Nam · {dest.count.toLocaleString()} chỗ ở
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-10 text-gray-400">
                <MapPin className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-sm md:text-base">
                  Không tìm thấy kết quả
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALENDAR PANEL */}
      {activePanel === "calendar" && (
        <div
          className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50"
          style={{ animation: "fadeSlideIn 200ms ease-out" }}
        >
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
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
                      <strong className="text-gray-900 dark:text-white">
                        {formatDate(checkInDate)}
                      </strong>{" "}
                      →{" "}
                      <strong className="text-gray-900 dark:text-white">
                        {formatDate(checkOutDate)}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      Nhận:{" "}
                      <strong className="text-gray-900 dark:text-white">
                        {formatDate(checkInDate)}
                      </strong>
                    </span>
                  )}
                </div>
                {checkOutDate && (
                  <button
                    type="button"
                    onClick={() => setActivePanel("guests")}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 md:px-6 py-2 rounded-xl transition-colors text-xs md:text-sm shrink-0"
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
      {activePanel === "guests" && (
        <div
          className="absolute top-full right-0 mt-3 w-full md:w-[340px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-4 md:p-5 z-50"
          style={{ animation: "fadeSlideIn 200ms ease-out" }}
        >
          <GuestRow
            label="Người lớn"
            desc="Từ 13 tuổi"
            value={adults}
            min={1}
            max={16}
            onChange={setAdults}
          />
          <GuestRow
            label="Trẻ em"
            desc="0 – 12 tuổi"
            value={children}
            min={0}
            max={10}
            onChange={setChildren}
          />
          <GuestRow
            label="Phòng"
            desc="Số phòng"
            value={rooms}
            min={1}
            max={8}
            onChange={setRooms}
            isLast
          />
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Xong
          </button>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

/* ===== MONTH GRID COMPONENT ===== */
function MonthGrid({
  year,
  month,
  checkIn,
  checkOut,
  onDayClick,
}: {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  onDayClick: (date: Date) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <h4 className="text-center font-bold text-gray-900 dark:text-white mb-3 text-base">
        {MONTHS_VN[month]} {year}
      </h4>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_VN.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-400 py-1.5"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;

          const date = new Date(year, month, day);
          const past = isPast(date);
          const isCheckIn = isSameDay(date, checkIn);
          const isCheckOut = isSameDay(date, checkOut);
          const inRange = isInRange(date, checkIn, checkOut);
          const isToday = isSameDay(date, new Date());

          let classes =
            "relative h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all cursor-pointer ";

          if (past) {
            classes += "text-gray-300 dark:text-zinc-700 cursor-not-allowed ";
          } else if (isCheckIn || isCheckOut) {
            classes += "bg-rose-600 text-white font-bold shadow-sm ";
          } else if (inRange) {
            classes +=
              "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 ";
          } else if (isToday) {
            classes +=
              "ring-2 ring-rose-500 text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 ";
          } else {
            classes +=
              "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 ";
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
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-200 whitespace-nowrap">
                  nhận
                </span>
              )}
              {isCheckOut && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-rose-200 whitespace-nowrap">
                  trả
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== GUEST ROW ===== */
function GuestRow({
  label,
  desc,
  value,
  min,
  max,
  onChange,
  isLast = false,
}: {
  label: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-4 ${!isLast ? "border-b border-gray-100 dark:border-zinc-800" : ""}`}
    >
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
        <span className="w-8 text-center font-bold text-gray-900 dark:text-white text-lg">
          {value}
        </span>
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
  );
}
