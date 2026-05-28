"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RoomBookingControlProps = {
  href: string;
  maxRooms?: number;
  price: string;
  currency: string;
};

export default function RoomBookingControl({
  href,
  maxRooms = 2,
  price,
  currency,
}: RoomBookingControlProps) {
  const [quantity, setQuantity] = useState(0);

  const rawPriceNum = useMemo(() => {
    return parseInt(price.replace(/\./g, ""));
  }, [price]);

  const checkoutHref = useMemo(() => {
    if (quantity < 1) return href;
    const [path, query = ""] = href.split("?");
    const params = new URLSearchParams(query);
    params.set("rooms", String(quantity));
    return `${path}?${params.toString()}`;
  }, [href, quantity]);

  const formatPriceValue = (value: number) => {
    if (currency === "USD") {
      return `USD ${(value / 27000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `VND ${value.toLocaleString("vi-VN")}`;
  };

  const totalPrice = rawPriceNum * quantity;

  return (
    <div className="flex flex-col gap-3 min-w-[220px]">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label className="space-y-1">
            <span className="block text-xs font-bold text-zinc-600">
              Chọn số lượng
            </span>
            <select
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-full rounded border border-zinc-300 bg-white p-2 text-sm font-bold text-zinc-900 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-100"
            >
              <option value={0}>0</option>
              {Array.from({ length: maxRooms }, (_, index) => index + 1).map(
                (value) => {
                  const calculatedPrice = rawPriceNum * value;
                  const formattedOptionText = currency === "USD"
                    ? `(USD ${(calculatedPrice / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                    : `(VND ${calculatedPrice.toLocaleString("vi-VN")})`;
                  return (
                    <option key={value} value={value}>
                      {value} &nbsp;&nbsp;{formattedOptionText}
                    </option>
                  );
                },
              )}
            </select>
          </label>
        </div>

        {quantity > 0 && (
          <div className="text-right shrink-0 pt-6">
            <div className="text-xs text-zinc-700">
              {quantity} phòng tổng giá
            </div>
            <div className="text-base font-black text-zinc-950">
              {formatPriceValue(totalPrice)}
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Đã bao gồm thuế và phí</div>
          </div>
        )}
      </div>

      {quantity > 0 ? (
        <div className="space-y-2">
          <Link
            href={checkoutHref}
            className="block w-full rounded bg-rose-600 px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.99]"
          >
            Tôi sẽ đặt
          </Link>
          <div className="text-center text-[11px] leading-relaxed text-zinc-500">
            <p className="font-semibold text-zinc-600">Chuyển sang bước kế tiếp</p>
            <p>Chỉ mất 2 phút</p>
            <p>bạn sẽ không bị trừ tiền ngay</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded bg-zinc-100 border border-zinc-200 px-4 py-2.5 text-center text-sm font-bold text-zinc-400"
          >
            Chọn số lượng
          </button>
          <div className="text-center text-[10px] text-zinc-500">
            Chọn ít nhất 1 phòng/căn để đặt. Không cần thẻ tín dụng.
          </div>
        </div>
      )}
    </div>
  );
}
