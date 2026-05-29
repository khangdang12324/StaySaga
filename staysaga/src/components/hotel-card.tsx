"use client";

import { useRouter } from "next/navigation";
import { Bed, MapPin, Star } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { Hotel } from "@/lib/hotel-parser";
import { getImageAltText, resolveHotelImage } from "@/lib/hotel-images";
import { resolveToCanonicalSlug } from "@/lib/hotel-parser";

export interface HotelCardProps {
  hotel: Hotel;
  className?: string;
}

export default function HotelCard({ hotel, className = "" }: HotelCardProps) {
  const router = useRouter();
  const imageUrl = resolveHotelImage(hotel);
  const altText = getImageAltText(hotel);

  const handleCardClick = () => {
    const canonical = resolveToCanonicalSlug(hotel.slug || String(hotel.id));
    const href = canonical
      ? `/homestays/${canonical}`
      : `/homestays?location=${encodeURIComponent(hotel.city)}`;
    router.push(href);
  };

  const handleBookingClick = () => {
    const canonical = resolveToCanonicalSlug(hotel.slug || String(hotel.id));
    const href = canonical
      ? `/homestays/${canonical}#booking`
      : `/homestays?location=${encodeURIComponent(hotel.city)}#booking`;
    router.push(href);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
      className={`group cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.12)] ${className}`.trim()}
    >
      <div className="relative h-60 overflow-hidden bg-zinc-100">
        <SafeImage
          src={imageUrl}
          alt={altText}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          StaySaga Hotels
        </div>
        {hotel.remaining_rooms ? (
          <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm">
            Còn {hotel.remaining_rooms} phòng
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            {hotel.hotelType}
          </div>
          <h3 className="line-clamp-2 text-xl font-semibold text-zinc-950">
            {hotel.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1">
            <MapPin className="h-4 w-4 text-rose-500" />
            {hotel.city}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1">
            <Bed className="h-4 w-4 text-rose-500" />
            {hotel.roomTypeLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>
                {hotel.displayRating ? hotel.displayRating.toFixed(1) : "Mới"}
              </span>
              <span className="text-zinc-400">•</span>
              <span>{hotel.reviews_count ?? 0} đánh giá</span>
            </div>
            <div className="mt-1 text-lg font-bold text-zinc-950">
              {hotel.priceFormatted}
              <span className="ml-1 text-sm font-medium text-zinc-500">
                / đêm
              </span>
            </div>
            {hotel.originalPriceFormatted ? (
              <div className="text-xs text-zinc-400 line-through">
                {hotel.originalPriceFormatted}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCardClick();
              }}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Xem chi tiết
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleBookingClick();
              }}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Đặt ngay
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
