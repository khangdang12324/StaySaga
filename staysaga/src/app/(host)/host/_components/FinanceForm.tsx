"use client";
import { useState } from "react";
import { ChevronsUpDown, Download } from "lucide-react";
import toast from "react-hot-toast";

function getCurrentFinancePeriod() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const part = (type: string) =>
    Number(parts.find((item) => item.type === type)?.value || 0);

  return {
    year: String(part("year")),
    month: `Tháng ${part("month")}`,
  };
}

export function FinanceForm() {
  const currentPeriod = getCurrentFinancePeriod();
  const [year, setYear] = useState(currentPeriod.year);
  const [month, setMonth] = useState(currentPeriod.month);
  const [docType, setDocType] = useState("Tóm tắt các loại giấy tờ (XLS)");
  const [isLoading, setIsLoading] = useState(false);
  const monthOptions = Array.from(
    new Set([currentPeriod.month, "Tháng 5", "Tháng 4", "Tháng 3", "Tháng 2", "Tháng 1"]),
  );

  const handleCreateFile = () => {
    setIsLoading(true);
    const toastId = toast.loading(`Đang tạo ${docType.toLowerCase()} cho ${month.toLowerCase()} năm ${year}...`);

    setTimeout(() => {
      setIsLoading(false);
      toast.success("Tạo tập tin thành công! Bắt đầu tải xuống...", { id: toastId });
      
      // Trigger a mock file download
      try {
        const content = `StaySaga Financial Report\nYear: ${year}\nMonth: ${month}\nDocument Type: ${docType}\nStatus: Settled\nGenerated At: ${new Date().toISOString()}`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `staysaga_finance_${year}_${month.replace(/\s+/g, "")}_${docType.includes("PDF") ? "pdf" : "xls"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Failed to download file:", err);
      }
    }, 1500);
  };

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      {/* Year Selector */}
      <div className="relative min-w-[100px] flex-1 sm:flex-initial">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          disabled={isLoading}
          className="w-full appearance-none rounded border border-[#f60057] bg-white px-4 py-2.5 pr-10 font-medium text-[#f60057] focus:outline-none focus:ring-1 focus:ring-[#f60057] disabled:opacity-50 cursor-pointer text-sm"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#f60057]">
          <ChevronsUpDown size={15} />
        </span>
      </div>

      {/* Month Selector */}
      <div className="relative min-w-[130px] flex-1 sm:flex-initial">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={isLoading}
          className="w-full appearance-none rounded border border-[#f60057] bg-white px-4 py-2.5 pr-10 font-medium text-[#f60057] focus:outline-none focus:ring-1 focus:ring-[#f60057] disabled:opacity-50 cursor-pointer text-sm"
        >
          {monthOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#f60057]">
          <ChevronsUpDown size={15} />
        </span>
      </div>

      {/* Document Type Selector */}
      <div className="relative min-w-[280px] flex-1">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={isLoading}
          className="w-full appearance-none rounded border border-[#f60057] bg-white px-4 py-2.5 pr-10 font-medium text-[#f60057] focus:outline-none focus:ring-1 focus:ring-[#f60057] disabled:opacity-50 cursor-pointer text-sm"
        >
          <option value="Tóm tắt các loại giấy tờ (XLS)">Tóm tắt các loại giấy tờ (XLS)</option>
          <option value="Tất cả giấy tờ (PDF)">Tất cả giấy tờ (PDF)</option>
          <option value="Tất cả sao kê đặt phòng (XLS)">Tất cả sao kê đặt phòng (XLS)</option>
        </select>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#f60057]">
          <ChevronsUpDown size={15} />
        </span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleCreateFile}
        disabled={isLoading}
        className="ml-auto inline-flex items-center gap-2 rounded bg-[#f60057] px-6 py-2.5 font-bold text-white hover:bg-[#d8004f] transition focus:outline-none disabled:opacity-50 text-sm shadow-sm cursor-pointer"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white">
          <Download size={11} className="stroke-[2.5]" />
        </div>
        <span>{isLoading ? "Đang tạo..." : "Tạo tập tin"}</span>
      </button>
    </div>
  );
}
