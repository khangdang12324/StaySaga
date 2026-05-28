"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Star, Heart, Share2, Info, Search } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";

type MapModalProps = {
  hotelTitle: string;
  displayRating: number;
  reviewsCount: number;
  address: string;
  mapQuery: string;
  heroImage: string;
  price: string;
  roomName: string;
};

// Global event trigger helper
export function triggerMapModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-map-modal"));
  }
}

// 1. Client Trigger Component: Link under Title
export function MapLinkTrigger() {
  return (
    <button
      onClick={triggerMapModal}
      className="font-bold text-rose-600 hover:underline cursor-pointer"
    >
      Vị trí xuất sắc - hiển thị bản đồ
    </button>
  );
}

// 2. Client Trigger Component: Sidebar Mini Map
export function MapSidebarTrigger({ mapQuery }: { mapQuery: string }) {
  return (
    <div
      onClick={triggerMapModal}
      className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm cursor-pointer h-48"
    >
      <iframe
        title="mini map"
        loading="lazy"
        className="h-full w-full border-0 grayscale group-hover:grayscale-0 transition-all duration-700 pointer-events-none"
        src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
      />
      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
        <div className="rounded-full bg-rose-600 px-6 py-2.5 text-[13px] font-bold text-white shadow-xl group-hover:scale-105 transition-transform">
          Hiển thị trên bản đồ
        </div>
      </div>
    </div>
  );
}

// 3. Main Modal Component
export function MapModal({
  hotelTitle,
  displayRating,
  reviewsCount,
  address,
  mapQuery,
  heroImage,
  price,
  roomName,
}: MapModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("open-map-modal", open);
    return () => window.removeEventListener("open-map-modal", open);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-100 animate-fadeIn text-zinc-900">
      {/* Header bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:px-6 shadow-sm">
        <span className="text-base font-extrabold text-zinc-900">Bản đồ khu vực</span>
        <button
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-1.5 rounded border border-zinc-300 bg-white px-4 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <span>Đóng bản đồ</span>
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Map body */}
      <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map View Canvas (Right side, fills screen) */}
        <div className="flex-1 relative h-full bg-zinc-200">
          <iframe
            title="full-screen map"
            loading="lazy"
            className="h-full w-full border-0 pointer-events-auto"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          />

          {/* Search Box on Map */}
          <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-32px)]">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 shadow-lg">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Xem khoảng cách từ..."
                className="w-full text-xs outline-none bg-transparent"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Left Column: Floating Information Card (Overlay) */}
        <div className="absolute top-16 left-4 bottom-4 z-10 w-96 max-w-[calc(100vw-32px)] flex flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-y-auto max-h-[calc(100vh-160px)]">
          {/* Top Panel Header (Property details) */}
          <div className="relative border-b border-zinc-100 p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex gap-4">
              <div className="relative h-20 w-24 overflow-hidden rounded-md shrink-0">
                <SafeImage src={heroImage} alt={hotelTitle} fill className="object-cover" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="font-extrabold text-sm text-zinc-900 leading-snug">{hotelTitle}</h3>
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="flex h-6 items-center justify-center rounded bg-rose-600 px-1.5 text-xs font-black text-white">
                    {displayRating.toFixed(1)}
                  </span>
                  <div className="text-[11px]">
                    <span className="font-extrabold text-zinc-900">Xuất sắc</span>
                    <span className="text-zinc-500 block">{reviewsCount} đánh giá</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold text-rose-600">10 Địa điểm</span>
              <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                Ưu Đãi Trong Thời Gian Có Hạn
              </span>
            </div>
          </div>

          {/* Room Deal Details */}
          <div className="p-4 border-b border-zinc-100 bg-zinc-50">
            <h4 className="font-bold text-xs text-zinc-800">{roomName}</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">1 đêm, 2 người lớn</p>
            
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xs text-zinc-400 line-through">VND 800.000</span>
              <span className="text-base font-black text-zinc-950">{price}</span>
              <Info className="h-3 w-3 text-zinc-400" />
            </div>
            <p className="text-[9px] text-zinc-500">Đã bao gồm thuế và phí</p>
            <p className="mt-1.5 text-[10px] font-bold text-emerald-700">✓ Miễn phí hủy</p>

            <button
              onClick={() => {
                setIsOpen(false);
                const el = document.getElementById("booking");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
            >
              <span>Xem phòng</span>
              <span className="text-[10px]">&gt;</span>
            </button>
            
            <div className="mt-3 flex items-start gap-1 text-[10px] text-zinc-500 leading-relaxed">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>{address}</span>
            </div>
          </div>

          {/* Attraction Distances list */}
          <div className="p-4 space-y-3">
            <h4 className="font-bold text-xs text-zinc-900">Các địa điểm tham quan hàng đầu</h4>
            <ul className="space-y-2">
              {[
                { name: "Bảo tàng nghệ thuật thêu XQ Village", dist: "3,1 km" },
                { name: "Công viên Yersin", dist: "3,4 km" },
                { name: "Quảng trường Lâm Viên", dist: "3,4 km" },
                { name: "Khách sạn Hằng Nga", dist: "4 km" },
                { name: "Dinh Bảo Đại", dist: "4,5 km" },
              ].map((item, idx) => (
                <li key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-700 font-medium leading-tight">{item.name}</span>
                  <span className="text-zinc-500 font-bold shrink-0 ml-4">{item.dist}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
