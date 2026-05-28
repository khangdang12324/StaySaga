"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, Star, Info, HeartIcon, X } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";

type Review = {
  name: string;
  text: string;
  country: string;
};

type GallerySectionProps = {
  hotelTitle: string;
  images: string[];
  displayRating: number;
  reviewsCount: number;
  reviews: Review[];
};

export default function GallerySection({
  hotelTitle,
  images,
  displayRating,
  reviewsCount,
  reviews,
}: GallerySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const heroImage = images[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
  const secondaryImages = images.slice(1);

  // Dynamic categorisation of images for tabs
  const categories = [
    { id: "all", name: "Tổng quan", items: images },
    { id: "rooms", name: "Phòng ngủ", items: images.filter((_, i) => i % 2 === 1) },
    { id: "common", name: "Không gian chung", items: images.filter((_, i) => i % 2 === 0) },
  ];

  const activeImages = categories.find((c) => c.id === activeCategory)?.items || images;

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

  const getRatingLabel = (score: number) => {
    if (score >= 9) return "Xuất sắc";
    if (score >= 8) return "Rất tốt";
    if (score >= 7) return "Tốt";
    return "Đánh giá chung";
  };

  return (
    <>
      {/* Main Grid Gallery on Detail Page */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-lg">
          {/* Main Big Image */}
          <div
            onClick={() => setIsOpen(true)}
            className="col-span-4 lg:col-span-2 row-span-2 relative aspect-[4/3] lg:aspect-auto h-full min-h-[400px] cursor-pointer group overflow-hidden"
          >
            <SafeImage
              src={heroImage}
              alt={hotelTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Grid Images */}
          <div className="hidden lg:grid col-span-2 grid-cols-2 grid-rows-2 gap-1.5">
            {secondaryImages.slice(0, 4).map((img, i) => (
              <div
                key={i}
                onClick={() => setIsOpen(true)}
                className="relative aspect-square cursor-pointer group overflow-hidden"
              >
                <SafeImage
                  src={img}
                  alt={`${hotelTitle} ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {i === 3 && secondaryImages.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white font-bold transition group-hover:bg-black/60">
                    <span className="text-xl">+{secondaryImages.length - 3}</span>
                    <span className="text-xs font-semibold mt-1">Xem tất cả ảnh</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking.com Style Gallery Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-fadeIn">
          {/* Header Bar */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:px-6">
            <div className="flex items-center gap-4">
              <span className="text-base font-bold text-zinc-900 md:text-lg">{hotelTitle}</span>
              <a
                href="#booking"
                onClick={() => setIsOpen(false)}
                className="hidden rounded bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 sm:inline-block"
              >
                Đặt ngay
              </a>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              <span>Đóng</span>
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-[1400px] gap-6 p-4 md:p-6 lg:grid-cols-[1fr_360px]">
              {/* Left Column: Categories and Images */}
              <div className="space-y-6">
                {/* Category Selection Tabs with Previews */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-zinc-100 no-scrollbar">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const previewImg = cat.items[0] || heroImage;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="group flex flex-col items-center shrink-0"
                      >
                        <div
                          className={`relative h-12 w-20 overflow-hidden rounded border-2 transition-all ${
                            isActive
                              ? "border-rose-600 ring-2 ring-rose-100"
                              : "border-transparent group-hover:border-zinc-300"
                          }`}
                        >
                          <SafeImage src={previewImg} alt={cat.name} fill className="object-cover" />
                        </div>
                        <span
                          className={`mt-1.5 text-[11px] font-bold transition-colors ${
                            isActive ? "text-rose-600" : "text-zinc-500 group-hover:text-zinc-800"
                          }`}
                        >
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Images Grid */}
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {activeImages.map((img, idx) => (
                    <div key={idx} className="group relative aspect-[4/3] overflow-hidden rounded bg-zinc-100 border border-zinc-200">
                      <SafeImage src={img} alt={`${hotelTitle} ${idx + 1}`} fill className="object-cover" />
                      <div className="absolute right-2 top-2 rounded bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Ratings and Reviews (Sticky) */}
              <aside className="space-y-6 lg:sticky lg:top-6 lg:h-[fit-content]">
                {/* Rating Score Panel */}
                <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-zinc-900">{getRatingLabel(displayRating)}</h3>
                      <p className="text-xs text-zinc-500">{reviewsCount} đánh giá</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-600 text-lg font-black text-white shadow-md">
                      {displayRating.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Review Quotes */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-zinc-900">Đọc xem khách yêu thích điều gì nhất:</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {reviews.map((rev, idx) => (
                      <div key={idx} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs shadow-inner">
                        <p className="italic text-zinc-700 leading-relaxed">&ldquo;{rev.text}&rdquo;</p>
                        <div className="mt-2 flex items-center gap-1.5 font-bold text-zinc-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          <span>{rev.name}</span>
                          <span className="text-[10px] text-zinc-500 font-medium">— {rev.country}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown Progress Bars */}
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Hạng mục đánh giá:</h4>
                  {[
                    { label: "Nhân viên phục vụ", score: 9.4 },
                    { label: "Tiện nghi", score: 9.2 },
                    { label: "Sạch sẽ", score: 9.3 },
                    { label: "Thoải mái", score: 9.4 },
                    { label: "Đáng giá tiền", score: 9.1 },
                    { label: "Địa điểm", score: 9.5 },
                  ].map((cat) => (
                    <div key={cat.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-700">
                        <span>{cat.label}</span>
                        <span>{cat.score}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full bg-rose-600"
                          style={{ width: `${cat.score * 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
