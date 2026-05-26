"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RoomBookingControlProps = {
  href: string;
  maxRooms?: number;
};

export default function RoomBookingControl({
  href,
  maxRooms = 2,
}: RoomBookingControlProps) {
  const [quantity, setQuantity] = useState(0);

  const checkoutHref = useMemo(() => {
    if (quantity < 1) return href;
    const [path, query = ""] = href.split("?");
    const params = new URLSearchParams(query);
    params.set("rooms", String(quantity));
    return `${path}?${params.toString()}`;
  }, [href, quantity]);

  return (
    <div className="flex flex-col gap-3">
      <label className="space-y-1">
        <span className="block text-xs font-bold text-zinc-600">
          Số phòng/căn
        </span>
        <select
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm font-bold text-zinc-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        >
          <option value={0}>Chọn số lượng</option>
          {Array.from({ length: maxRooms }, (_, index) => index + 1).map(
            (value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ),
          )}
        </select>
      </label>

      {quantity > 0 ? (
        <Link
          href={checkoutHref}
          className="w-full rounded bg-rose-600 px-4 py-3 text-center text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-rose-700"
        >
          Tôi sẽ đặt
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded bg-zinc-200 px-4 py-3 text-center text-[15px] font-bold text-zinc-500"
        >
          Chọn số lượng
        </button>
      )}

      <div className="text-center text-[10px] text-zinc-500">
        Chọn ít nhất 1 phòng/căn để đặt. Không cần thẻ tín dụng.
      </div>
    </div>
  );
}
