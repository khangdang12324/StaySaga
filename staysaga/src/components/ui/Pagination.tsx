"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate range of page numbers
  const pageNumbers: number[] = [];
  const maxPageButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white">
      <div className="text-xs font-semibold text-slate-500">
        Hiển thị <span className="font-extrabold text-slate-800">{startItem}</span> -{" "}
        <span className="font-extrabold text-slate-800">{endItem}</span> trên tổng số{" "}
        <span className="font-extrabold text-slate-800">{totalItems}</span> kết quả
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all duration-150"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page number buttons */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-150 ${
                currentPage === 1
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950/10"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-slate-400 text-xs">...</span>}
          </>
        )}

        {pageNumbers.map((page) => {
          if (page === 1 || page === totalPages) return null; // Avoid duplicate render for first/last page
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-150 ${
                currentPage === page
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950/10"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          );
        })}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-150 ${
                currentPage === totalPages
                  ? "bg-rose-600 text-white shadow-md shadow-rose-950/10"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500 transition-all duration-150"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
