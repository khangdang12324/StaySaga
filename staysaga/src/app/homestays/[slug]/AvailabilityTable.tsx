"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  Sparkles,
  HelpCircle,
  Navigation,
  CalendarDays,
  Users,
  User,
  RotateCw,
} from "lucide-react";

type Room = {
  name: string;
  size: string;
  price: string;
  original: string;
  savings: string;
  capacity: number;
  left?: number;
};

type AvailabilityTableProps = {
  rooms: Room[];
  hotelId: string;
  hotelSlug: string;
  defaultCheckInParam: string;
  defaultCheckOutParam: string;
  currency: string;
  guests?: number;
};

export default function AvailabilityTable({
  rooms,
  hotelId,
  hotelSlug,
  defaultCheckInParam,
  defaultCheckOutParam,
  currency,
  guests = 2,
}: AvailabilityTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for dates and guests in widget
  const [checkIn, setCheckIn] = useState(defaultCheckInParam);
  const [checkOut, setCheckOut] = useState(defaultCheckOutParam);
  const [guestsCount, setGuestsCount] = useState(guests);
  const [loading, setLoading] = useState(false);

  // Sync state if props change (standard React pattern)
  const [prevProps, setPrevProps] = useState({
    defaultCheckInParam,
    defaultCheckOutParam,
    guests,
  });

  if (
    prevProps.defaultCheckInParam !== defaultCheckInParam ||
    prevProps.defaultCheckOutParam !== defaultCheckOutParam ||
    prevProps.guests !== guests
  ) {
    setCheckIn(defaultCheckInParam);
    setCheckOut(defaultCheckOutParam);
    setGuestsCount(guests);
    setPrevProps({ defaultCheckInParam, defaultCheckOutParam, guests });
  }

  // Filter state for "Lọc theo:"
  const [filterType, setFilterType] = useState({
    room: false,
    apartment: false,
  });

  // Calculate nights
  const nights = useMemo(() => {
    if (!defaultCheckInParam || !defaultCheckOutParam) return 1;
    const start = new Date(defaultCheckInParam);
    const end = new Date(defaultCheckOutParam);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [defaultCheckInParam, defaultCheckOutParam]);

  // Check if dates or guest count changed from what is currently applied
  const hasChanges = useMemo(() => {
    return (
      checkIn !== defaultCheckInParam ||
      checkOut !== defaultCheckOutParam ||
      guestsCount !== guests
    );
  }, [checkIn, checkOut, guestsCount, defaultCheckInParam, defaultCheckOutParam, guests]);

  // Store selected quantity for each room index
  const [selections, setSelections] = useState<Record<number, number>>({});

  const handleSelectChange = (index: number, val: number) => {
    setSelections((prev) => ({
      ...prev,
      [index]: val,
    }));
  };

  // Calculations
  const { totalRooms, totalPrice, totalOriginalPrice } = useMemo(() => {
    let roomsCount = 0;
    let priceSum = 0;
    let originalPriceSum = 0;

    rooms.forEach((room, idx) => {
      const qty = selections[idx] || 0;
      if (qty > 0) {
        roomsCount += qty;
        const parsedPrice = parseInt(room.price.replace(/\./g, ""));
        const parsedOriginal = parseInt(room.original.replace(/\./g, ""));
        
        priceSum += parsedPrice * qty * nights;
        originalPriceSum += parsedOriginal * qty * nights;
      }
    });

    return {
      totalRooms: roomsCount,
      totalPrice: priceSum,
      totalOriginalPrice: originalPriceSum,
    };
  }, [selections, rooms, nights]);

  const formatPriceValue = (value: number) => {
    if (currency === "USD") {
      return `USD ${(value / 27000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `VND ${value.toLocaleString("vi-VN")}`;
  };

  // Custom checkout link construction
  const checkoutHref = useMemo(() => {
    const baseUrl = `/checkout/${hotelSlug || hotelId}`;
    const params = new URLSearchParams();
    params.set("checkIn", defaultCheckInParam);
    params.set("checkOut", defaultCheckOutParam);
    params.set("guests", String(guests));
    params.set("rooms", String(totalRooms));
    
    // Pass selected rooms details including unit prices for dynamic checkout billing
    const selectedList = Object.entries(selections)
      .filter(([_, qty]) => qty > 0)
      .map(([idx, qty]) => ({
        name: rooms[Number(idx)].name,
        qty,
        price: rooms[Number(idx)].price,
        original: rooms[Number(idx)].original,
      }));
    params.set("details", JSON.stringify(selectedList));

    return `${baseUrl}?${params.toString()}`;
  }, [hotelSlug, hotelId, defaultCheckInParam, defaultCheckOutParam, totalRooms, selections, rooms, guests]);

  const handleDateChange = (type: "checkIn" | "checkOut", value: string) => {
    if (type === "checkIn") {
      setCheckIn(value);
      const start = new Date(value);
      const end = new Date(checkOut);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end <= start) {
          const nextDay = new Date(start);
          nextDay.setDate(start.getDate() + 1);
          setCheckOut(nextDay.toISOString().split("T")[0]);
        }
      }
    } else {
      setCheckOut(value);
    }
  };

  const handleApplyChanges = () => {
    setLoading(true);
    setTimeout(() => {
      const params = new URLSearchParams();
      params.set("checkIn", checkIn);
      params.set("checkOut", checkOut);
      params.set("guests", String(guestsCount));
      
      router.push(`/homestays/${hotelSlug}?${params.toString()}`, { scroll: false });
      
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }, 800);
  };

  // Filter rooms based on checkbox selection
  const filteredRooms = useMemo(() => {
    const showRoom = filterType.room;
    const showApartment = filterType.apartment;
    
    if ((showRoom && showApartment) || (!showRoom && !showApartment)) {
      return rooms;
    }
    
    return rooms.filter((room) => {
      const nameLower = room.name.toLowerCase();
      if (showRoom && (nameLower.includes("phòng") || nameLower.includes("room") || nameLower.includes("superior"))) {
        return true;
      }
      if (showApartment && (nameLower.includes("căn") || nameLower.includes("hộ") || nameLower.includes("apartment"))) {
        return true;
      }
      return false;
    });
  }, [rooms, filterType]);

  return (
    <div className="space-y-6">
      {/* 1. Search Box (Yellow wrapper like Booking.com) */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-red-500 p-1.5 shadow-lg shadow-rose-100">
        <div className="flex flex-col md:flex-row items-stretch gap-1">
          {/* Dates Selector */}
          <div className="relative flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3 border border-transparent focus-within:ring-2 focus-within:ring-rose-200">
            <CalendarDays className="h-5 w-5 text-rose-500 shrink-0" />
            <div className="flex-1 flex gap-2 text-xs font-bold text-zinc-700">
              <div className="flex flex-col flex-1 min-w-[110px]">
                <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Nhận phòng</span>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => handleDateChange("checkIn", e.target.value)}
                  className="w-full font-bold text-zinc-900 outline-none bg-transparent mt-0.5 cursor-pointer text-sm"
                />
              </div>
              <div className="border-l border-rose-100 self-stretch my-1"></div>
              <div className="flex flex-col flex-1 min-w-[110px]">
                <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Trả phòng</span>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => handleDateChange("checkOut", e.target.value)}
                  className="w-full font-bold text-zinc-900 outline-none bg-transparent mt-0.5 cursor-pointer text-sm"
                  min={checkIn}
                />
              </div>
            </div>
          </div>

          {/* Guests Selector */}
          <div className="relative flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3 border border-transparent focus-within:ring-2 focus-within:ring-rose-200">
            <Users className="h-5 w-5 text-rose-500 shrink-0" />
            <div className="flex-1 flex flex-col">
              <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Số lượng khách</span>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                className="w-full font-bold text-zinc-900 outline-none bg-transparent mt-0.5 text-sm cursor-pointer py-0.5"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g} người lớn · 0 trẻ em · 1 phòng
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleApplyChanges}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-7 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.99] shrink-0 sm:w-auto w-full cursor-pointer"
          >
            {hasChanges ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                Áp dụng thay đổi
              </>
            ) : (
              "Thay đổi tìm kiếm"
            )}
          </button>
        </div>
      </div>

      {/* 2. Filters Box: Lọc theo */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-bold text-zinc-800">Lọc theo:</span>
        <label className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/70 px-3 py-2 font-semibold text-zinc-700 cursor-pointer select-none transition hover:border-rose-200 hover:bg-rose-50">
          <input
            type="checkbox"
            checked={filterType.room}
            onChange={(e) => setFilterType((prev) => ({ ...prev, room: e.target.checked }))}
            className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          Phòng
        </label>
        <label className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/70 px-3 py-2 font-semibold text-zinc-700 cursor-pointer select-none transition hover:border-rose-200 hover:bg-rose-50">
          <input
            type="checkbox"
            checked={filterType.apartment}
            onChange={(e) => setFilterType((prev) => ({ ...prev, apartment: e.target.checked }))}
            className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          Căn hộ
        </label>
      </div>

      {/* 3. Availability Table */}
      <div className="overflow-hidden rounded-2xl border border-rose-100 shadow-xl shadow-rose-50 relative">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gradient-to-r from-rose-600 to-red-500 text-white text-xs font-bold uppercase">
            <tr className="divide-x divide-white/20">
              <th className="px-4 py-3.5 w-[30%] border-b border-zinc-200">Loại chỗ ở</th>
              <th className="px-4 py-3.5 w-[10%] text-center border-b border-zinc-200">Số lượng khách</th>
              <th className="px-4 py-3.5 w-[15%] bg-rose-800 relative text-center border-b border-rose-200">
                <span className="relative z-10">Giá cho {nights} đêm</span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-rose-800" />
              </th>
              <th className="px-4 py-3.5 w-[22%] border-b border-zinc-200">Các lựa chọn</th>
              <th className="px-4 py-3.5 w-[11%] text-center border-b border-zinc-200">Chọn số lượng</th>
              <th className="px-4 py-3.5 w-[12%] bg-rose-50 border-b border-rose-100"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100 bg-white">
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 font-medium bg-zinc-50/50">
                  Không tìm thấy phòng phù hợp với bộ lọc. Hãy thử bỏ chọn bộ lọc để hiển thị toàn bộ phòng trống.
                </td>
              </tr>
            ) : (
              filteredRooms.map((room, idx) => {
                const originalIdx = rooms.findIndex((r) => r.name === room.name);
                const currentQty = selections[originalIdx] || 0;
                const roomPriceNum = parseInt(room.price.replace(/\./g, ""));
                const showRowSpan = idx === 0;

                return (
                  <tr key={room.name} className="hover:bg-rose-50/40 transition-colors divide-x divide-rose-100">
                    {/* 1. Room Info */}
                    <td className="px-4 py-5 align-top">
                      <button className="font-bold text-rose-600 hover:text-rose-700 hover:underline text-[15px] text-left">
                        {room.name}
                      </button>
                      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-500 font-medium">
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5 text-zinc-400" /> 1 giường đôi lớn
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-zinc-400" /> {room.size}
                        </span>
                        <span className="text-zinc-700">Phòng tắm riêng</span>
                        <span className="text-emerald-700 font-bold">WiFi miễn phí</span>
                      </div>
                    </td>

                    {/* 2. Capacity */}
                    <td className="px-4 py-5 align-top text-center">
                      <div className="flex justify-center gap-0.5 text-zinc-700">
                        {Array.from({ length: room.capacity || 2 }).map((_, i) => (
                          <User key={i} className="h-4 w-4 text-zinc-700 fill-zinc-700" />
                        ))}
                      </div>
                    </td>

                    {/* 3. Price column */}
                    <td className="px-4 py-5 align-top">
                      <div className="text-[11px] text-rose-600 line-through font-semibold">
                        {formatPriceValue(parseInt(room.original.replace(/\./g, "")) * nights)}
                      </div>
                      <div className="text-lg font-black text-zinc-950 mt-0.5">
                        {formatPriceValue(roomPriceNum * nights)}
                      </div>
                      <div className="text-[10px] text-zinc-500">Đã bao gồm thuế và phí</div>
                      <div className="mt-1.5 inline-block rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                        Tiết kiệm {room.savings}
                      </div>
                    </td>

                    {/* 4. Policies/Options */}
                    <td className="px-4 py-5 align-top space-y-2 text-xs">
                      <div className="flex items-center gap-1 font-bold text-rose-700">
                        <span>✓ Bao gồm 1 chỗ đậu xe + nhận phòng trễ</span>
                      </div>
                      <div className="text-rose-700 font-medium">
                        ✓ Hủy miễn phí trước 18:00, 29 tháng 5, 2026
                      </div>
                      <div className="text-zinc-600">
                        ✓ Không cần thanh toán trước - thanh toán tại chỗ nghỉ
                      </div>
                      <div className="text-zinc-500 font-semibold">
                        ✓ Không cần thẻ tín dụng
                      </div>
                      {room.left && (
                        <div className="text-rose-600 font-bold text-[11px] mt-1">
                          • Chúng tôi còn {room.left} căn
                        </div>
                      )}
                    </td>

                    {/* 5. Dropdown Selection */}
                    <td className="px-4 py-5 align-top text-center">
                      <select
                        value={currentQty}
                        onChange={(e) => handleSelectChange(originalIdx, Number(e.target.value))}
                        className="w-full rounded-lg border border-rose-200 bg-white p-1.5 text-xs font-bold text-zinc-800 outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 cursor-pointer"
                      >
                        <option value={0}>0</option>
                        {Array.from({ length: room.left || 4 }, (_, i) => i + 1).map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 6. Sticky Booking Summary Column */}
                    {showRowSpan && (
                      <td
                        rowSpan={filteredRooms.length}
                        className="align-top border-l border-rose-100 bg-gradient-to-b from-rose-50 to-white p-4 w-[230px]"
                      >
                        <div className="sticky top-24 space-y-4">
                          {totalRooms > 0 ? (
                            <>
                              <div className="text-right space-y-1">
                                <div className="text-xs font-bold text-zinc-700">
                                  {totalRooms} phòng, {nights} đêm
                                </div>
                                <div className="text-[11px] text-zinc-400 line-through font-semibold">
                                  {formatPriceValue(totalOriginalPrice)}
                                </div>
                                <div className="text-lg font-black text-zinc-950">
                                  {formatPriceValue(totalPrice)}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-medium leading-tight">
                                  Đã bao gồm thuế và phí
                                </div>
                              </div>

                              <Link
                                href={checkoutHref}
                                className="block w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-3 text-center text-sm font-bold text-white shadow-md shadow-rose-100 transition hover:from-rose-700 hover:to-red-700 active:scale-[0.99]"
                              >
                                Tôi sẽ đặt
                              </Link>

                              <div className="text-[11px] leading-relaxed text-zinc-500 space-y-1">
                                <p className="font-bold text-zinc-700">
                                  Bạn sẽ được chuyển sang bước kế tiếp
                                </p>
                                <ul className="list-disc pl-3 space-y-0.5">
                                  <li>Chỉ mất có 2 phút</li>
                                  <li>Bạn sẽ không bị trừ tiền ngay</li>
                                </ul>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-4 py-4 text-center">
                              <button
                                type="button"
                                disabled
                                className="w-full cursor-not-allowed rounded-xl bg-rose-100 border border-rose-100 py-2.5 text-xs font-bold text-rose-300"
                              >
                                Tôi sẽ đặt
                              </button>
                              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                                Chọn số lượng phòng/căn ở cột bên cạnh để hiển thị tổng giá trị đặt phòng.
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Full screen loading overlay matching the 3rd screenshot */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="rounded-lg bg-white p-6 shadow-xl flex flex-col items-center gap-4 min-w-[220px]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-600 border-t-transparent" />
            <p className="text-sm font-bold text-zinc-700">Đang tải ngày...</p>
          </div>
        </div>
      )}
    </div>
  );
}
