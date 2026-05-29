"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Map,
  MapPin,
  Users,
} from "lucide-react";
import DetailedFilters, {
  defaultFilters,
  formatVnd,
  getDistanceKm,
  getRatingLabel,
  inferFacets,
  matchesFilters,
  normalizeRating,
  normalizeText,
  type FilterState,
} from "@/components/features/search/DetailedFilters";
import SafeImage from "@/components/ui/SafeImage";
import { fallbackHotelNames, locationHotelNames } from "@/data/location-hotel-names";
import { getAllHotels, getAvailableCities, resolveToCanonicalSlug, type Hotel, supportedCities } from "@/lib/hotel-parser";
import { resolveHotelImage } from "@/lib/hotel-images";
import { AdvancedSearchBar } from "@/components/features/search/AdvancedSearchBar";
import HomestaysLoading from "./loading";

const getCleanHotelTitle = (hotel: Hotel) => hotel.title;

const getDisplayCity = (hotel: Hotel, selectedCity?: string | null) =>
  selectedCity?.trim() || hotel.city || "";

const sortHotels = (hotels: Hotel[], filters: FilterState, selectedCity?: string | null) => {
  const sorted = [...hotels];
  switch (filters.sortBy) {
    case "price-low":
      sorted.sort((a, b) => inferFacets(a, selectedCity).price - inferFacets(b, selectedCity).price);
      break;
    case "price-high":
      sorted.sort((a, b) => inferFacets(b, selectedCity).price - inferFacets(a, selectedCity).price);
      break;
    case "rating":
      sorted.sort((a, b) => inferFacets(b, selectedCity).rating10 - inferFacets(a, selectedCity).rating10);
      break;
    case "popular":
    default:
      sorted.sort((a, b) => (b.reviews_count ?? 0) - (a.reviews_count ?? 0));
      break;
  }
  return sorted;
};

export default function HomestaysPage() {
  return (
    <Suspense fallback={<HomestaysLoading />}>
      <HomestaysPageContent />
    </Suspense>
  );
}

function HomestaysPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location")?.trim() || "";
  const allHotels = useMemo(() => getAllHotels(), []);
  const cities = useMemo(
    () => Array.from(new Set([...supportedCities, ...getAvailableCities()])),
    [],
  );
  const selectedCity = useMemo(() => {
    const exactCity = cities.find(
      (city) => normalizeText(city) === normalizeText(locationParam),
    );
    return exactCity || locationParam || "Đà Lạt";
  }, [cities, locationParam]);
  const [destinationInput, setDestinationInput] = useState(selectedCity);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const sourceHotels = useMemo(() => {
    const filtered = allHotels.filter(h => normalizeText(h.city) === normalizeText(selectedCity));
    // Fallback: If no hotels for the city exist, we just return empty array
    return filtered;
  }, [allHotels, selectedCity]);

  const filteredHotels = useMemo(() => {
    return sortHotels(
      sourceHotels.filter((hotel) => matchesFilters(hotel, filters, selectedCity)),
      filters,
      selectedCity,
    );
  }, [sourceHotels, filters, selectedCity]);

  const resetFilters = () => setFilters(defaultFilters);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = destinationInput.trim() || "Đà Lạt";
    router.push(`/homestays?location=${encodeURIComponent(value)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StaySagaHeader />

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="relative z-30 mt-4 w-full">
          <AdvancedSearchBar />
        </div>

        <nav className="mt-4 flex flex-wrap items-center gap-1 text-sm text-rose-600">
          {["Trang chủ", "Việt Nam", selectedCity, "Kết quả tìm kiếm"].map((item, index) => (
            <span key={item} className="flex items-center gap-1">
              <span className={index === 3 ? "text-gray-600" : "hover:underline"}>{item}</span>
              {index < 3 ? <span className="text-gray-400">/</span> : null}
            </span>
          ))}
        </nav>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[310px_1fr]">
          <DetailedFilters
            hotels={sourceHotels}
            filters={filters}
            selectedCity={selectedCity}
            onChange={setFilters}
            onReset={resetFilters}
          />

          <main className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-950">
                  Chúng tôi đã tìm thấy {filteredHotels.length} nơi lưu trú cho bạn
                </h1>
                <p className="mt-1 text-sm text-gray-600">Xem kết quả ở {selectedCity}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-600 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Map className="h-4 w-4" />
                Hiển thị trên bản đồ
              </button>
            </div>

            <div className="mb-4 flex justify-end">
              <select
                value={filters.sortBy}
                onChange={(event) =>
                  setFilters({ ...filters, sortBy: event.target.value as FilterState["sortBy"] })
                }
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
              >
                <option value="popular">Sắp xếp: Phù hợp nhất</option>
                <option value="price-low">Giá thấp nhất</option>
                <option value="price-high">Giá cao nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>

            {filteredHotels.length > 0 ? (
              <div className="space-y-4">
                {filteredHotels.map((hotel) => (
                  <SearchResultCard key={`${hotel.slug}-${hotel.id}`} hotel={hotel} selectedCity={selectedCity} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-96 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    Không tìm thấy chỗ nghỉ phù hợp
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Hãy thử bỏ bớt bộ lọc hoặc điều chỉnh ngân sách của bạn.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-5 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StaySagaHeader() {
  return (
    <header className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-500 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="text-2xl font-black tracking-tight">StaySaga</div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button className="rounded-md px-3 py-2 font-semibold hover:bg-white/10">VND</button>
          <button className="rounded-md border border-white/60 px-3 py-2 font-semibold hover:bg-white/10">
            Đăng chỗ nghỉ của Quý vị
          </button>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-rose-600">
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Phúc Khang Đặng Nguyễn</div>
              <div className="text-xs text-rose-100">Thành viên StaySaga</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}



function SearchResultCard({ hotel, selectedCity }: { hotel: Hotel; selectedCity?: string | null }) {
  const facets = inferFacets(hotel, selectedCity);
  const rating = normalizeRating(hotel);
  const displayCity = getDisplayCity(hotel, selectedCity);
  const distanceKm = getDistanceKm(hotel, selectedCity);
  const canonical = resolveToCanonicalSlug(hotel.slug || String(hotel.id));
  const href = canonical ? `/homestays/${canonical}` : `/homestays?location=${encodeURIComponent(displayCity)}`;
  const currentPrice = hotel.discounted_price ?? hotel.price ?? 0;
  const originalPrice = hotel.original_price ?? (hotel.discounted_price && hotel.price ? hotel.price : null);
  const taxAmount = Math.max(30000, Math.round(currentPrice * 0.08));

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {facets.featured ? (
        <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-gray-800">
          <span className="font-bold text-rose-700">Nổi bật</span>
          <span className="ml-2">
            Chỗ nghỉ này phù hợp với tiêu chí của bạn và có thể được xếp hạng cao hơn trong kết quả tìm kiếm.
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[240px_1fr_190px]">
        <Link href={href} className="relative block h-56 overflow-hidden rounded-md bg-gray-100 md:h-full">
          <SafeImage
            src={resolveHotelImage(hotel)}
            alt={getCleanHotelTitle(hotel)}
            fill
            sizes="(max-width: 768px) 100vw, 240px"
            className="object-cover"
          />
        </Link>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <Link href={href} className="text-xl font-bold text-rose-600 hover:underline">
              {getCleanHotelTitle(hotel)}
            </Link>
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-rose-600" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-gray-700">{displayCity}</span>
            <Link className="font-semibold text-rose-600 hover:underline" href="#map">
              Xem trên bản đồ
            </Link>
            <span className="text-gray-600">Cách trung tâm {distanceKm.toFixed(1)} km</span>
          </div>

          <div className="mt-4 border-l-2 border-gray-200 pl-3">
            <p className="font-bold text-gray-950">{hotel.room_name || hotel.roomTypeLabel}</p>
            <p className="mt-1 text-sm text-gray-700">{hotel.bed_info || "Giường đôi hoặc hai giường đơn"}</p>
          </div>

          <div className="mt-4 space-y-1 text-sm">
            {facets.bookingPolicies.includes("free-cancellation") ? (
              <p className="font-semibold text-rose-700">Miễn phí hủy</p>
            ) : null}
            {facets.bookingPolicies.includes("no-prepayment") ? (
              <p className="font-semibold text-rose-700">Không cần thanh toán trước</p>
            ) : null}
            {hotel.remaining_rooms ? (
              <p className="font-semibold text-red-700">Chỉ còn {hotel.remaining_rooms} phòng trên StaySaga</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 md:text-right">
          <div className="flex items-start justify-between gap-3 md:justify-end">
            <div>
              <p className="font-bold text-gray-950">{getRatingLabel(rating)}</p>
              <p className="text-xs text-gray-600">{hotel.reviews_count ?? 0} đánh giá</p>
            </div>
            <div className="rounded-md rounded-br-none bg-rose-600 px-2.5 py-1.5 text-sm font-bold text-white">
              {rating.toFixed(1)}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600">1 đêm, 2 người lớn</p>
            {originalPrice && originalPrice > currentPrice ? (
              <p className="text-sm text-red-700 line-through">{formatVnd(originalPrice)}</p>
            ) : null}
            <p className="text-2xl font-bold text-gray-950">{formatVnd(currentPrice)}</p>
            <p className="text-xs text-gray-600">+{formatVnd(taxAmount)} thuế và phí</p>
            <Link
              href={href}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
            >
              Xem chỗ trống
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
