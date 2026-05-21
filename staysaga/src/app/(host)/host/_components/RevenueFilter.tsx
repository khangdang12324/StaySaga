"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface Option {
  value: string;
  label: string;
}

export function RevenueFilter({
  options,
  initialValue,
}: {
  options: Option[];
  initialValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedValue(val);
  };

  const handleApply = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", selectedValue);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-800">Lọc theo thời gian</span>
        <select
          value={selectedValue}
          onChange={handleSelectChange}
          disabled={isPending}
          className="min-w-[280px] border border-slate-400 bg-white px-4 py-3 font-semibold text-slate-800 focus:border-[#f60057] focus:outline-none disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={handleApply}
        disabled={isPending}
        className="rounded bg-[#f60057] px-6 py-3 font-bold text-white transition hover:bg-[#d8004f] focus:outline-none disabled:opacity-50"
      >
        {isPending ? "Đang tải..." : "Hiển thị"}
      </button>
    </div>
  );
}
