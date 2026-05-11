"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { differenceInDays } from "date-fns";

interface BookingWidgetProps {
  propertyId: string;
  basePrice: number;
  bookingStatus?: {
    status: string;
    checkIn?: string | null;
    checkOut?: string | null;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export function BookingWidget({
  propertyId,
  basePrice,
  bookingStatus,
}: BookingWidgetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const guestsRef = useRef<HTMLSelectElement>(null);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [guests, setGuests] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const bookingLabel = bookingStatus
    ? STATUS_LABELS[bookingStatus.status] || "Đã đặt phòng"
    : null;

  useEffect(() => {
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const guestsParam = searchParams.get("guests");

    if (!checkIn && checkInParam && !Number.isNaN(Date.parse(checkInParam))) {
      setCheckIn(checkInParam);
    }
    if (
      !checkOut &&
      checkOutParam &&
      !Number.isNaN(Date.parse(checkOutParam))
    ) {
      setCheckOut(checkOutParam);
    }
    if (!Number.isNaN(Number(guestsParam)) && guestsParam && guests === 1) {
      const parsedGuests = Math.min(8, Math.max(1, Number(guestsParam)));
      setGuests(parsedGuests);
    }
  }, [searchParams, checkIn, checkOut, guests]);

  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    const input = ref.current;
    if (!input) return;
    if (
      typeof (input as HTMLInputElement & { showPicker?: () => void })
        .showPicker === "function"
    ) {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
      return;
    }
    input.focus();
  };

  const openGuestsPicker = () => {
    const select = guestsRef.current;
    if (!select) return;
    select.focus();
    select.click();
  };

  // Enterprise Business Logic: Dynamic Pricing Calculation
  const {
    totalDays,
    accommodationsCost,
    cleaningFee,
    serviceFee,
    totalAmount,
  } = useMemo(() => {
    let days = 0;
    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      days = differenceInDays(end, start);
      if (days < 0) days = 0;
    }

    const cost = days > 0 ? basePrice * days : basePrice;
    // Phí dọn dẹp cố định
    const cleaning = 300000;
    // Nền tảng thu phí dịch vụ 12% trên giá gốc
    const service = Math.round(cost * 0.12);

    return {
      totalDays: days || 1,
      accommodationsCost: cost,
      cleaningFee: cleaning,
      serviceFee: service,
      totalAmount: cost + cleaning + service,
    };
  }, [checkIn, checkOut, basePrice]);

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      setError("Vui lòng chọn ngày nhận và trả phòng hợp lệ!");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Ngày trả phòng phải sau ngày nhận phòng.");
      return;
    }
    setError(null);
    // Chuyển hướng sang trang thanh toán kèm tham số (thực tế sẽ gọi Server Action để tạo bản ghi PENDING)
    const params = new URLSearchParams({
      propertyId,
      checkIn,
      checkOut,
      guests: guests.toString(),
      totalAmount: totalAmount.toString(),
      step: "info",
    });
    router.push(`/checkout/${propertyId}?${params.toString()}`);
  };

  return (
    <div className="sticky top-28 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl z-10">
      {bookingStatus && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-semibold">Bạn đã đặt phòng ({bookingLabel}).</p>
          {bookingStatus.checkIn && bookingStatus.checkOut && (
            <p className="mt-1 text-xs">
              {bookingStatus.checkIn} → {bookingStatus.checkOut}
            </p>
          )}
          <Link
            href="/bookings"
            className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-600"
          >
            Xem đơn đặt phòng
          </Link>
        </div>
      )}

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-2xl font-black text-rose-600">
          {basePrice.toLocaleString("vi-VN")}đ
        </span>
        <span className="text-gray-500">/ đêm</span>
      </div>

      <div className="border border-gray-300 dark:border-zinc-700 rounded-xl overflow-hidden mb-6">
        <div className="flex border-b border-gray-300 dark:border-zinc-700">
          <div
            className="flex-1 p-3 border-r border-gray-300 dark:border-zinc-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => openDatePicker(checkInRef)}
          >
            <label className="text-xs font-bold uppercase block w-full cursor-pointer">
              Nhận phòng
            </label>
            <input
              ref={checkInRef}
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError(null);
              }}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border-none outline-none mt-1 text-sm font-medium cursor-pointer"
            />
          </div>
          <div
            className="flex-1 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => openDatePicker(checkOutRef)}
          >
            <label className="text-xs font-bold uppercase block w-full cursor-pointer">
              Trả phòng
            </label>
            <input
              ref={checkOutRef}
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError(null);
              }}
              min={checkIn || new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border-none outline-none mt-1 text-sm font-medium cursor-pointer"
            />
          </div>
        </div>
        <div
          className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          onClick={openGuestsPicker}
        >
          <label className="text-xs font-bold uppercase block w-full cursor-pointer">
            Khách
          </label>
          <select
            ref={guestsRef}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent border-none outline-none mt-1 text-sm font-medium cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n} className="text-gray-900">
                {n} khách
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      <button
        onClick={handleBooking}
        className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg mb-4"
      >
        Đặt phòng ngay
      </button>
      <p className="text-center text-gray-500 text-sm mb-6">
        Bạn vẫn chưa bị trừ tiền
      </p>

      {/* Phân tích giá (Pricing Breakdown) - Ẩn nếu chưa chọn ngày */}
      {checkIn && checkOut && (
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-800 pb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between">
            <span className="underline">
              {basePrice.toLocaleString("vi-VN")}đ x {totalDays} đêm
            </span>
            <span>{accommodationsCost.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="underline">Phí dọn dẹp</span>
            <span>{cleaningFee.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="underline">Phí dịch vụ StaySaga</span>
            <span>{serviceFee.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>
      )}

      <div className="flex justify-between font-black text-lg pt-6 text-gray-900 dark:text-white">
        <span>Tổng cộng</span>
        <span className="text-rose-600">
          {totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>
    </div>
  );
}
