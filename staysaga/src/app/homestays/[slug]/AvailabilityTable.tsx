"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble, Sparkles, HelpCircle, Navigation } from "lucide-react";

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
};

export default function AvailabilityTable({
  rooms,
  hotelId,
  hotelSlug,
  defaultCheckInParam,
  defaultCheckOutParam,
  currency,
}: AvailabilityTableProps) {
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
        
        priceSum += parsedPrice * qty;
        originalPriceSum += parsedOriginal * qty;
      }
    });

    return {
      totalRooms: roomsCount,
      totalPrice: priceSum,
      totalOriginalPrice: originalPriceSum,
    };
  }, [selections, rooms]);

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
    params.set("guests", "2");
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
  }, [hotelSlug, hotelId, defaultCheckInParam, defaultCheckOutParam, totalRooms, selections, rooms]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-rose-600 text-white text-xs uppercase font-bold">
          <tr>
            <th className="px-4 py-3.5 w-[30%]">Loại chỗ nghỉ</th>
            <th className="px-4 py-3.5 w-[10%] text-center">Số lượng khách</th>
            <th className="px-4 py-3.5 w-[15%]">Giá hôm nay</th>
            <th className="px-4 py-3.5 w-[22%]">Các lựa chọn</th>
            <th className="px-4 py-3.5 w-[11%]">Chọn số lượng</th>
            <th className="px-4 py-3.5 w-[12%]"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rooms.map((room, idx) => {
            const currentQty = selections[idx] || 0;
            const roomPriceNum = parseInt(room.price.replace(/\./g, ""));
            const showRowSpan = idx === 0;

            return (
              <tr key={room.name} className="hover:bg-zinc-50/50 transition-colors">
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
                  <div className="flex justify-center gap-0.5 text-zinc-600">
                    <BedDouble className="h-4 w-4" />
                  </div>
                </td>

                {/* 3. Today's Price */}
                <td className="px-4 py-5 align-top">
                  <div className="text-[11px] text-rose-600 line-through font-semibold">
                    {formatPriceValue(parseInt(room.original.replace(/\./g, "")))}
                  </div>
                  <div className="text-lg font-black text-zinc-950 mt-0.5">
                    {formatPriceValue(roomPriceNum)}
                  </div>
                  <div className="text-[10px] text-zinc-500">Đã bao gồm thuế và phí</div>
                  <div className="mt-1.5 inline-block rounded bg-emerald-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    Tiết kiệm {room.savings}
                  </div>
                </td>

                {/* 4. Policies/Options */}
                <td className="px-4 py-5 align-top space-y-2 text-xs">
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <span>✓ Bao gồm 1 chỗ đậu xe + nhận phòng trễ</span>
                  </div>
                  <div className="text-emerald-700 font-medium">
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
                <td className="px-4 py-5 align-top">
                  <select
                    value={currentQty}
                    onChange={(e) => handleSelectChange(idx, Number(e.target.value))}
                    className="w-full rounded border border-zinc-300 bg-white p-1.5 text-xs font-bold text-zinc-800 outline-none focus:border-rose-600"
                  >
                    <option value={0}>0</option>
                    {Array.from({ length: room.left || 4 }, (_, i) => i + 1).map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </td>

                {/* 6. Sticky Booking Summary Column (rowSpan spanning all rows) */}
                {showRowSpan && (
                  <td
                    rowSpan={rooms.length}
                    className="align-top border-l border-zinc-200 bg-rose-50/20 p-4 w-[230px]"
                  >
                    <div className="sticky top-24 space-y-4">
                      {totalRooms > 0 ? (
                        <>
                          <div className="text-right space-y-1">
                            <div className="text-xs font-bold text-zinc-700">
                              {totalRooms} phòng tổng giá
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
                            className="block w-full rounded bg-rose-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-md transition hover:bg-rose-700 active:scale-[0.99]"
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
                            className="w-full cursor-not-allowed rounded bg-zinc-100 border border-zinc-200 py-2.5 text-xs font-bold text-zinc-400"
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
          })}
        </tbody>
      </table>
    </div>
  );
}
