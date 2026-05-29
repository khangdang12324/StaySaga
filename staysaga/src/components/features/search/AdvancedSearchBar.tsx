"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getLocationImage } from "@/lib/images/location-images";
import SafeImage from "@/components/ui/SafeImage";

/* ===== DATA ===== */
const DESTINATIONS = [
  {
    name: "TP. Hồ Chí Minh",
    count: 2845,
    image: getLocationImage("TP. Hồ Chí Minh"),
    description: "Ẩm thực, mua sắm, nhịp sống đô thị",
  },
  {
    name: "Hà Nội",
    count: 1920,
    image: getLocationImage("Hà Nội"),
    description: "Phố cổ, văn hóa, cuối tuần lãng mạn",
  },
  {
    name: "Đà Lạt",
    count: 1356,
    image: getLocationImage("Đà Lạt"),
    description: "Khí hậu mát, villa, nghỉ dưỡng",
  },
  {
    name: "Nha Trang",
    count: 1124,
    image: getLocationImage("Nha Trang"),
    description: "Biển xanh, resort, gia đình",
  },
  {
    name: "Đà Nẵng",
    count: 1580,
    image: getLocationImage("Đà Nẵng"),
    description: "Biển, cầu đêm, khách sạn trung tâm",
  },
  {
    name: "Huế",
    count: 860,
    image: getLocationImage("Huế"),
    description: "Di sản, ẩm thực, nghỉ chậm",
  },
  {
    name: "Cần Thơ",
    count: 740,
    image: getLocationImage("Cần Thơ"),
    description: "Sông nước, chợ nổi, homestay vườn",
  },
  {
    name: "Hạ Long",
    count: 980,
    image: getLocationImage("Hạ Long"),
    description: "Vịnh biển, du thuyền, kỳ nghỉ ngắn",
  },
  {
    name: "Ninh Bình",
    count: 690,
    image: getLocationImage("Ninh Bình"),
    description: "Núi đá, cảnh quan, retreat",
  },
  {
    name: "Vũng Tàu",
    count: 920,
    image: getLocationImage("Vũng Tàu"),
    description: "Biển gần Sài Gòn, cuối tuần",
  },
  {
    name: "Quy Nhơn",
    count: 540,
    image: getLocationImage("Quy Nhơn"),
    description: "Biển yên, nghỉ dưỡng riêng tư",
  },
  {
    name: "Phú Quốc",
    count: 1260,
    image: getLocationImage("Phú Quốc"),
    description: "Đảo biển, resort, tuần trăng mật",
  },
  {
    name: "Hội An",
    count: 880,
    image: getLocationImage("Hội An"),
    description: "Phố cổ, boutique stay, ẩm thực",
  },
  {
    name: "Sa Pa",
    count: 760,
    image: getLocationImage("Sa Pa"),
    description: "Núi rừng, săn mây, bungalow",
  },
  {
    name: "Mũi Né",
    count: 620,
    image: getLocationImage("Mũi Né"),
    description: "Đồi cát, biển, resort nghỉ dưỡng",
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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

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
  const searchParams = useSearchParams();
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

  // Sync state with URL search params
  useEffect(() => {
    const loc = searchParams.get("location");
    if (loc) {
      setLocationInput(loc);
    }
    const inDateStr = searchParams.get("checkIn") || searchParams.get("checkin");
    const outDateStr = searchParams.get("checkOut") || searchParams.get("checkout");
    if (inDateStr) {
      const inDate = new Date(inDateStr);
      if (!isNaN(inDate.getTime())) {
        setCheckInDate(inDate);
        setCalendarBaseMonth({ year: inDate.getFullYear(), month: inDate.getMonth() });
      }
    }
    if (outDateStr) {
      const outDate = new Date(outDateStr);
      if (!isNaN(outDate.getTime())) {
        setCheckOutDate(outDate);
      }
    }
    const guests = searchParams.get("guests");
    if (guests) {
      const numGuests = Number(guests);
      if (!isNaN(numGuests) && numGuests > 0) {
        setAdults(numGuests);
        setChildren(0);
      }
    }
    const roomsParam = searchParams.get("rooms");
    if (roomsParam) {
      const numRooms = Number(roomsParam);
      if (!isNaN(numRooms) && numRooms > 0) {
        setRooms(numRooms);
      }
    }
  }, [searchParams]);

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
  const normalizedLocationInput = normalizeText(locationInput);
  const filteredDestinations = normalizedLocationInput
    ? DESTINATIONS.filter((d) =>
        normalizeText(d.name).includes(normalizedLocationInput),
      )
    : DESTINATIONS;
  const shouldShowLocationPanel =
    activePanel === "location" &&
    (!normalizedLocationInput || filteredDestinations.length > 0);

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
    setActivePanel(null);
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

  const isExpanded = activePanel !== null;

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        if (isExpanded && e.target === e.currentTarget) {
          setActivePanel(null);
        }
      }}
      className={
        isExpanded
          ? "fixed inset-0 z-[100] flex items-start justify-center bg-black/55 px-4 pt-20 md:pt-24"
          : "relative z-20 mx-auto w-full max-w-5xl px-4 md:px-0"
      }
    >
      <div className={isExpanded ? "relative w-full max-w-5xl" : "relative w-full"}>
      {/* ===== SEARCH BAR — Booking.com style ===== */}
      <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <form
          onSubmit={handleSearch}
          className="flex flex-col text-left md:min-h-[76px] md:flex-row"
        >
          <div className="flex flex-col md:flex-row md:flex-1">
            {/* LOCATION */}
            <div
              onClick={() => {
                setActivePanel("location");
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className={`flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-4 transition-colors md:flex-1 md:border-b-0 md:border-r md:px-5 md:py-0 ${activePanel === "location" ? "bg-rose-50/70" : "hover:bg-rose-50/50"}`}
            >
              <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
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
                    if (e.target.value.trim()) setFormError(null);
                    setActivePanel("location");
                  }}
                  onFocus={() => setActivePanel("location")}
                  className="w-full truncate border-none bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400 md:text-lg"
                />
              </div>
            </div>

            {/* DATES */}
            <div
              onClick={() => setActivePanel("calendar")}
              className={`flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-4 transition-colors md:flex-1 md:border-b-0 md:border-r md:px-5 md:py-0 ${activePanel === "calendar" ? "bg-rose-50/70" : "hover:bg-rose-50/50"}`}
            >
              <CalendarIcon className="h-5 w-5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.18em] leading-none mb-1 block">
                  Ngày
                </label>
                <span
                  className={`block truncate text-sm font-semibold md:text-lg ${checkInDate ? "text-gray-900" : "text-gray-400"}`}
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
              className={`flex cursor-pointer items-center gap-3 px-4 py-4 transition-colors md:flex-1 md:px-5 md:py-0 ${activePanel === "guests" ? "bg-rose-50/70" : "hover:bg-rose-50/50"}`}
            >
              <Users className="h-5 w-5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.18em] leading-none mb-1 block">
                  Khách
                </label>
                <span className="block truncate text-sm font-semibold text-gray-900 md:text-lg">
                  {guestSummary}
                </span>
              </div>
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <div className="border-t border-gray-200 md:border-l md:border-t-0">
            <button
              type="submit"
              className="flex w-full shrink-0 items-center justify-center gap-2 bg-rose-600 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-rose-500 md:h-full md:w-auto md:min-w-44 md:px-9 md:py-0 md:text-lg"
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
      {shouldShowLocationPanel && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-4 max-h-[calc(100vh-220px)] overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-white/80 dark:bg-white"
          style={{ animation: "fadeSlideIn 200ms ease-out" }}
        >
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto p-4 md:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-600">
                  StaySaga gợi ý
                </p>
                <h3 className="mt-1 text-xl font-extrabold tracking-tight text-gray-950">
                  {locationInput.trim() ? "Kết quả phù hợp" : "Thành phố nổi tiếng"}
                </h3>
              </div>
              <p className="hidden max-w-xs text-right text-sm text-gray-500 md:block">
                Chọn nhanh điểm đến để tiếp tục chọn ngày và số khách.
              </p>
            </div>

            {filteredDestinations.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-700">
                      {locationInput.trim() ? "Kết quả tìm kiếm" : "Gợi ý hàng đầu"}
                    </h4>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                      {filteredDestinations.length} điểm đến
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredDestinations.slice(0, 6).map((dest) => (
                      <DestinationButton
                        key={dest.name}
                        destination={dest}
                        featured
                        onSelect={handleSelectCity}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-bold text-gray-700">
                    Thành phố được đặt nhiều
                  </h4>
                  <div className="space-y-2">
                    {DESTINATIONS.slice(0, 8).map((dest) => (
                      <DestinationButton
                        key={dest.name}
                        destination={dest}
                        compact
                        onSelect={handleSelectCity}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-gray-400">
                <MapPin className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm font-medium md:text-base">
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
          className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[calc(100vh-220px)] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-100 dark:bg-white"
          style={{ animation: "fadeSlideIn 200ms ease-out" }}
        >
          <div className="p-4 md:p-6">
            <div className="mb-3 flex items-center justify-between md:mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-600" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-600" />
              </button>
            </div>

            <div className="grid max-h-[calc(100vh-360px)] grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 md:gap-8">
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
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-100">
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
          className="absolute right-0 top-full z-50 mt-3 w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl md:p-5 dark:border-gray-100 dark:bg-white"
          style={{ animation: "fadeSlideIn 200ms ease-out", width: 340 }}
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
    </div>
  );
}

function DestinationButton({
  destination,
  onSelect,
  featured = false,
  compact = false,
}: {
  destination: (typeof DESTINATIONS)[number];
  onSelect: (name: string) => void;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(destination.name)}
      className={`group flex w-full items-center gap-3 rounded-2xl text-left transition-all hover:bg-rose-50 ${
        featured
          ? "border border-gray-100 bg-white p-3 shadow-sm hover:border-rose-100 hover:shadow-md"
          : "p-2"
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-rose-50 ${
          compact ? "h-12 w-12" : "h-16 w-16"
        }`}
      >
        <SafeImage
          src={destination.image}
          alt={destination.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-gray-950">
          {destination.name}
        </p>
        <p className="truncate text-xs font-medium text-gray-500">
          {destination.description}
        </p>
        {!compact && (
          <p className="mt-1 text-xs font-bold text-rose-600">
            {destination.count.toLocaleString()} chỗ ở
          </p>
        )}
      </div>
    </button>
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
      <h4 className="mb-3 text-center text-base font-bold text-gray-900 dark:text-gray-900">
        {MONTHS_VN[month]} {year}
      </h4>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_VN.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-xs font-semibold text-gray-400 dark:text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-y-2">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="h-11" />;

          const date = new Date(year, month, day);
          const past = isPast(date);
          const isCheckIn = isSameDay(date, checkIn);
          const isCheckOut = isSameDay(date, checkOut);
          const inRange = isInRange(date, checkIn, checkOut);
          const isToday = isSameDay(date, new Date());

          const rangeStart = isCheckIn && checkOut;
          const rangeEnd = isCheckOut && checkIn;
          const rangeClasses = inRange
            ? "bg-rose-50"
            : rangeStart
              ? "bg-linear-to-r from-transparent from-50% to-rose-50 to-50%"
              : rangeEnd
                ? "bg-linear-to-r from-rose-50 from-50% to-transparent to-50%"
                : "";

          let buttonClasses =
            "relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ";

          if (past) {
            buttonClasses += "cursor-not-allowed text-gray-300 dark:text-gray-300 ";
          } else if (isCheckIn || isCheckOut) {
            buttonClasses += "bg-rose-600 text-white shadow-[0_8px_18px_rgba(225,29,72,0.28)] ";
          } else if (inRange) {
            buttonClasses += "text-rose-700 hover:bg-rose-100 ";
          } else if (isToday) {
            buttonClasses += "border border-rose-500 text-rose-600 hover:bg-rose-50 ";
          } else {
            buttonClasses += "text-gray-700 hover:bg-gray-100 dark:text-gray-700 dark:hover:bg-gray-100 ";
          }

          return (
            <div
              key={day}
              className={`flex h-11 items-center justify-center ${rangeClasses}`}
            >
              <button
                type="button"
                disabled={past}
                onClick={() => onDayClick(date)}
                className={buttonClasses}
              >
                {day}
              </button>
            </div>
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
      className={`flex items-center justify-between py-4 ${!isLast ? "border-b border-gray-100 dark:border-gray-100" : ""}`}
    >
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-600 dark:border-gray-300 dark:text-gray-600"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-lg font-bold text-gray-900 dark:text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-rose-500 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-300 dark:text-gray-600"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
