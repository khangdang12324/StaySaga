"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { Hotel } from "@/lib/hotel-parser";

const PRICE_MIN = 50000;
const PRICE_MAX = 2000000;

export type SortType = "popular" | "price-low" | "price-high" | "rating";

export type FilterState = {
  priceMin: number;
  priceMax: number;
  popular: string[];
  minRating: number;
  propertyTypes: string[];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  maxDistanceKm: number;
  starRatings: string[];
  bedOptions: string[];
  meals: string[];
  bookingPolicies: string[];
  sortBy: SortType;
};

export type HotelFacets = {
  price: number;
  rating10: number;
  propertyTypes: string[];
  popular: string[];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  distanceKm: number;
  starRating: string;
  bedOptions: string[];
  meals: string[];
  bookingPolicies: string[];
  featured: boolean;
};

type FilterOption = {
  value: string;
  label: string;
};

export const defaultFilters: FilterState = {
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  popular: [],
  minRating: 0,
  propertyTypes: [],
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  maxDistanceKm: 0,
  starRatings: [],
  bedOptions: [],
  meals: [],
  bookingPolicies: [],
  sortBy: "popular",
};

const popularOptions: FilterOption[] = [
  { value: "breakfast", label: "Bao gồm bữa sáng" },
  { value: "hotel", label: "Khách sạn" },
  { value: "double-bed", label: "Giường đôi" },
  { value: "hostel", label: "Nhà trọ" },
  { value: "rating-8", label: "Rất tốt: 8 điểm trở lên" },
  { value: "no-credit-card", label: "Đặt phòng không cần thẻ tín dụng" },
  { value: "preferred-area", label: "Khu vực khách thích" },
  { value: "homestay", label: "Chỗ nghỉ nhà dân" },
];

const ratingOptions = [
  { value: 9, label: "Tuyệt hảo: 9 điểm trở lên" },
  { value: 8, label: "Rất tốt: 8 điểm trở lên" },
  { value: 7, label: "Tốt: 7 điểm trở lên" },
  { value: 6, label: "Dễ chịu: 6 điểm trở lên" },
];

const propertyTypeOptions: FilterOption[] = [
  { value: "hotel", label: "Khách sạn" },
  { value: "entire-home", label: "Nhà & căn hộ nguyên căn" },
  { value: "apartment", label: "Căn hộ" },
  { value: "homestay", label: "Chỗ nghỉ nhà dân" },
  { value: "guesthouse", label: "Nhà khách" },
  { value: "villa", label: "Biệt thự" },
  { value: "bnb", label: "Nhà nghỉ B&B" },
  { value: "hostel", label: "Nhà trọ" },
  { value: "holiday-home", label: "Nhà nghỉ mát" },
  { value: "resort", label: "Resort" },
];

const amenityBaseOptions: FilterOption[] = [
  { value: "parking", label: "Chỗ đỗ xe" },
  { value: "restaurant", label: "Nhà hàng" },
  { value: "room-service", label: "Dịch vụ phòng" },
  { value: "front-desk", label: "Lễ tân 24 giờ" },
  { value: "fitness", label: "Trung tâm thể dục" },
];

const amenityMoreOptions: FilterOption[] = [
  { value: "wifi", label: "Wi-Fi miễn phí" },
  { value: "pool", label: "Hồ bơi" },
  { value: "spa", label: "Spa" },
  { value: "airport-shuttle", label: "Xe đưa đón sân bay" },
  { value: "family-room", label: "Phòng gia đình" },
  { value: "air-conditioning", label: "Điều hòa" },
  { value: "bar", label: "Quầy bar" },
  { value: "elevator", label: "Thang máy" },
];

const distanceOptions = [
  { value: 1, label: "Dưới 1 km" },
  { value: 3, label: "Dưới 3 km" },
  { value: 5, label: "Dưới 5 km" },
];

const starOptions: FilterOption[] = ["1 sao", "2 sao", "3 sao", "4 sao", "5 sao"].map((label) => ({
  value: label[0],
  label,
}));

const bedOptions: FilterOption[] = [
  { value: "twin-bed", label: "Hai giường đơn" },
  { value: "double-bed", label: "Giường đôi" },
];

const mealOptions: FilterOption[] = [
  { value: "self-catering", label: "Tự nấu" },
  { value: "breakfast", label: "Bao gồm bữa sáng" },
  { value: "all-meals", label: "Tất cả các bữa" },
  { value: "half-board", label: "Bao bữa sáng & bữa tối" },
];

const bookingPolicyOptions: FilterOption[] = [
  { value: "free-cancellation", label: "Miễn phí hủy" },
  { value: "no-credit-card", label: "Đặt phòng không cần thẻ tín dụng" },
  { value: "no-prepayment", label: "Không cần thanh toán trước" },
];

export function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const includesAny = (source: string, terms: string[]) =>
  terms.some((term) => source.includes(normalizeText(term)));

export function formatVnd(amount: number | null | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "VND 0";
  let currency = "VND";
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === "currency") currency = value;
    }
  }
  if (currency === "USD") {
     return `USD ${(amount / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `VND ${amount.toLocaleString("vi-VN")}`;
}

export function normalizeRating(hotel: Hotel) {
  const raw = hotel.displayRating ?? hotel.rating ?? 0;
  if (!raw) return 0;
  return raw <= 5 ? raw * 2 : raw;
}

export function getRatingLabel(score: number) {
  if (score >= 9) return "Tuyệt hảo";
  if (score >= 8) return "Rất tốt";
  if (score >= 7) return "Tốt";
  return "Dễ chịu";
}

export function getCenterDistanceLabel(selectedCity?: string | null) {
  const city = selectedCity?.trim();
  return city ? `Khoảng cách từ trung tâm ${city}` : "Khoảng cách từ trung tâm";
}

export function getDistanceKm(hotel: Hotel, selectedCity?: string | null) {
  const record = hotel as Hotel & {
    distance?: number | null;
    distanceKm?: number | null;
    distance_km?: number | null;
  };
  const explicitDistance = record.distanceKm ?? record.distance_km ?? record.distance;
  if (typeof explicitDistance === "number" && !Number.isNaN(explicitDistance)) {
    return explicitDistance;
  }

  const base = (Number(hotel.id ?? 1) || 1) + (selectedCity?.length || 0);
  return (((base * 37) % 58) + 2) / 10;
}

export function getStarRating(hotel: Hotel) {
  const price = hotel.discounted_price ?? hotel.price ?? 0;
  return String(Math.min(5, Math.max(1, Math.ceil((price || Number(hotel.id) || 1) / 450000))));
}

const parseRoomCount = (text: string, keyword: string) => {
  const match = text.match(new RegExp(`(\\d+)\\s*${keyword}`));
  return match ? Number(match[1]) : 0;
};

const deterministicValues = (id: number, options: string[], modulo: number) =>
  options.filter((_, index) => (id + index) % modulo === 0);

export function inferFacets(hotel: Hotel, selectedCity?: string | null): HotelFacets {
  const id = Number(hotel.id) || 0;
  const text = normalizeText(
    [
      hotel.title,
      hotel.hotelType,
      hotel.room_name,
      hotel.roomTypeLabel,
      hotel.bed_info,
      hotel.availability_text,
      hotel.prepayment_policy,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const propertyTypes = new Set<string>();
  if (includesAny(text, ["hotel", "khách sạn", "boutique"])) propertyTypes.add("hotel");
  if (includesAny(text, ["apartment", "apart", "căn hộ"])) propertyTypes.add("apartment");
  if (includesAny(text, ["homestay", "chỗ nghỉ nhà dân"])) propertyTypes.add("homestay");
  if (includesAny(text, ["villa", "biệt thự"])) propertyTypes.add("villa");
  if (includesAny(text, ["hostel", "nhà trọ"])) propertyTypes.add("hostel");
  if (includesAny(text, ["resort"])) propertyTypes.add("resort");
  if (propertyTypes.size === 0) propertyTypes.add("hotel");
  if (id % 4 === 0) propertyTypes.add("entire-home");
  if (id % 9 === 0) propertyTypes.add("guesthouse");
  if (id % 11 === 0) propertyTypes.add("bnb");
  if (id % 13 === 0) propertyTypes.add("holiday-home");

  const bedFacet = new Set<string>();
  if (includesAny(text, ["giường đôi", "double"])) bedFacet.add("double-bed");
  if (includesAny(text, ["hai giường đơn", "2 giường đơn", "twin"])) bedFacet.add("twin-bed");
  if (bedFacet.size === 0) bedFacet.add(id % 2 === 0 ? "double-bed" : "twin-bed");

  const bookingPolicies = new Set<string>();
  if (hotel.free_cancellation) bookingPolicies.add("free-cancellation");
  if (hotel.no_prepayment || includesAny(text, ["không cần thanh toán trước"])) {
    bookingPolicies.add("no-prepayment");
  }
  if (id % 3 !== 0) bookingPolicies.add("no-credit-card");

  const meals = new Set<string>();
  if (includesAny(text, ["bữa sáng", "breakfast"]) || id % 2 === 0) meals.add("breakfast");
  if (id % 5 === 0) meals.add("self-catering");
  if (id % 17 === 0) meals.add("all-meals");
  if (id % 19 === 0) meals.add("half-board");

  const amenities = new Set(deterministicValues(id, [...amenityBaseOptions, ...amenityMoreOptions].map((item) => item.value), 3));
  if (id % 2 === 0) amenities.add("parking");
  if (id % 5 === 0) amenities.add("restaurant");
  if (id % 7 === 0) amenities.add("front-desk");

  const rating10 = normalizeRating(hotel);
  const popular = new Set<string>();
  if (meals.has("breakfast")) popular.add("breakfast");
  if (propertyTypes.has("hotel")) popular.add("hotel");
  if (propertyTypes.has("hostel")) popular.add("hostel");
  if (propertyTypes.has("homestay")) popular.add("homestay");
  if (bedFacet.has("double-bed")) popular.add("double-bed");
  if (rating10 >= 8) popular.add("rating-8");
  if (bookingPolicies.has("no-credit-card")) popular.add("no-credit-card");
  if (id % 4 !== 0) popular.add("preferred-area");

  return {
    price: hotel.discounted_price ?? hotel.price ?? 0,
    rating10,
    propertyTypes: Array.from(propertyTypes),
    popular: Array.from(popular),
    bedrooms: parseRoomCount(text, "phong ngu") || (id % 6 === 0 ? 2 : 1),
    bathrooms: parseRoomCount(text, "phong tam") || (id % 5 === 0 ? 2 : 1),
    amenities: Array.from(amenities),
    distanceKm: getDistanceKm(hotel, selectedCity),
    starRating: getStarRating(hotel),
    bedOptions: Array.from(bedFacet),
    meals: Array.from(meals),
    bookingPolicies: Array.from(bookingPolicies),
    featured: id % 5 === 0 || rating10 >= 9,
  };
}

export const inferHotelFacets = inferFacets;

const matchesAnySelected = (selected: string[], values: string[]) =>
  selected.length === 0 || selected.some((value) => values.includes(value));

export function matchesFilters(hotel: Hotel, filters: FilterState, selectedCity?: string | null) {
  const facets = inferFacets(hotel, selectedCity);
  if (facets.price < filters.priceMin) return false;
  if (filters.priceMax < PRICE_MAX && facets.price > filters.priceMax) return false;
  if (filters.minRating > 0 && facets.rating10 < filters.minRating) return false;
  if (filters.bedrooms > 0 && facets.bedrooms < filters.bedrooms) return false;
  if (filters.bathrooms > 0 && facets.bathrooms < filters.bathrooms) return false;
  if (filters.maxDistanceKm > 0 && facets.distanceKm > filters.maxDistanceKm) return false;

  return (
    matchesAnySelected(filters.popular, facets.popular) &&
    matchesAnySelected(filters.propertyTypes, facets.propertyTypes) &&
    matchesAnySelected(filters.amenities, facets.amenities) &&
    matchesAnySelected(filters.starRatings, [facets.starRating]) &&
    matchesAnySelected(filters.bedOptions, facets.bedOptions) &&
    matchesAnySelected(filters.meals, facets.meals) &&
    matchesAnySelected(filters.bookingPolicies, facets.bookingPolicies)
  );
}

export function getFilterCounts(sourceHotels: Hotel[], selectedCity?: string | null) {
  const counts: Record<string, number> = {};
  const add = (group: keyof FilterState, values: string[]) => {
    values.forEach((value) => {
      const key = `${String(group)}:${value}`;
      counts[key] = (counts[key] || 0) + 1;
    });
  };

  sourceHotels.forEach((hotel) => {
    const facets = inferFacets(hotel, selectedCity);
    add("popular", facets.popular);
    add("propertyTypes", facets.propertyTypes);
    add("amenities", facets.amenities);
    add("starRatings", [facets.starRating]);
    add("bedOptions", facets.bedOptions);
    add("meals", facets.meals);
    add("bookingPolicies", facets.bookingPolicies);
    ratingOptions.forEach((option) => {
      if (facets.rating10 >= option.value) {
        counts[`rating:${option.value}`] = (counts[`rating:${option.value}`] || 0) + 1;
      }
    });
    distanceOptions.forEach((option) => {
      if (facets.distanceKm <= option.value) {
        counts[`distance:${option.value}`] = (counts[`distance:${option.value}`] || 0) + 1;
      }
    });
  });

  return counts;
}

export function applySmartFilters(query: string, current: FilterState): FilterState {
  const text = normalizeText(query);
  const next: FilterState = { ...current };
  const add = (key: keyof FilterState, value: string) => {
    const currentValues = next[key];
    if (Array.isArray(currentValues) && !currentValues.includes(value)) {
      next[key] = [...currentValues, value] as never;
    }
  };

  if (includesAny(text, ["đánh giá tốt", "rất tốt", "8 điểm"])) next.minRating = Math.max(next.minRating, 8);
  if (includesAny(text, ["tuyệt hảo", "9 điểm"])) next.minRating = Math.max(next.minRating, 9);
  if (includesAny(text, ["hủy miễn phí"])) add("bookingPolicies", "free-cancellation");
  if (includesAny(text, ["không cần thanh toán trước"])) add("bookingPolicies", "no-prepayment");
  if (includesAny(text, ["không cần thẻ tín dụng"])) add("bookingPolicies", "no-credit-card");
  if (includesAny(text, ["bữa sáng"])) {
    add("popular", "breakfast");
    add("meals", "breakfast");
  }
  if (includesAny(text, ["giường đôi"])) add("bedOptions", "double-bed");
  if (includesAny(text, ["khách sạn"])) add("propertyTypes", "hotel");
  return next;
}

const activeFilterCount = (filters: FilterState) => {
  const arrayCount = Object.values(filters).reduce<number>((sum, value) => {
    return sum + (Array.isArray(value) ? value.length : 0);
  }, 0);
  return (
    arrayCount +
    (filters.priceMin !== PRICE_MIN ? 1 : 0) +
    (filters.priceMax !== PRICE_MAX ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.bedrooms > 0 ? 1 : 0) +
    (filters.bathrooms > 0 ? 1 : 0) +
    (filters.maxDistanceKm > 0 ? 1 : 0)
  );
};

type DetailedFiltersProps = {
  hotels: Hotel[];
  filters: FilterState;
  selectedCity?: string | null;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
};

export default function DetailedFilters({ hotels, filters, selectedCity, onChange, onReset }: DetailedFiltersProps) {
  const [smartQuery, setSmartQuery] = useState("");
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const counts = useMemo(() => getFilterCounts(hotels, selectedCity), [hotels, selectedCity]);
  const activeCount = activeFilterCount(filters);

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });
  const toggle = (key: keyof FilterState, value: string) => {
    const current = filters[key];
    if (!Array.isArray(current)) return;
    update({
      [key]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    } as Partial<FilterState>);
  };

  const renderCheckboxGroup = (title: string, key: keyof FilterState, options: FilterOption[]) => (
    <FilterSection title={title}>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Array.isArray(filters[key]) && filters[key].includes(option.value)}
              onChange={() => toggle(key, option.value)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-rose-600"
            />
            <span className="flex-1 leading-5">{option.label}</span>
            <span className="text-xs text-gray-500">{counts[`${String(key)}:${option.value}`] || 0}</span>
          </label>
        ))}
      </div>
    </FilterSection>
  );

  return (
    <aside className="h-fit lg:sticky lg:top-4">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-bold text-gray-900">Chọn lọc theo:</h2>
          </div>
          {activeCount > 0 ? (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
              {activeCount}
            </span>
          ) : null}
        </div>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        </div>

        <FilterSection title="Ngân sách của bạn (mỗi đêm)" defaultOpen>
          <p className="mb-3 text-sm font-semibold text-gray-900">
            VND {filters.priceMin.toLocaleString("vi-VN")} -{" "}
            {filters.priceMax >= PRICE_MAX
              ? "VND 2.000.000+"
              : `VND ${filters.priceMax.toLocaleString("vi-VN")}`}
          </p>
          <RangeInput
            label="Tối thiểu"
            value={filters.priceMin}
            onChange={(value) => update({ priceMin: Math.min(value, filters.priceMax) })}
          />
          <RangeInput
            label="Tối đa"
            value={filters.priceMax}
            onChange={(value) => update({ priceMax: Math.max(value, filters.priceMin) })}
          />
        </FilterSection>

        {renderCheckboxGroup("Các bộ lọc phổ biến", "popular", popularOptions)}

        <FilterSection title="Bộ lọc thông minh">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Bạn đang tìm kiếm điều gì?
          </label>
          <input
            value={smartQuery}
            onChange={(event) => setSmartQuery(event.target.value)}
            placeholder="Ví dụ: Tôi muốn một nơi có đánh giá tốt và cho hủy miễn phí"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
          />
          <button
            type="button"
            onClick={() => update(applySmartFilters(smartQuery, filters))}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Search className="h-4 w-4" />
            Tìm chỗ nghỉ
          </button>
        </FilterSection>

        <FilterSection title="Điểm đánh giá của khách">
          <div className="space-y-2">
            {ratingOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="guest-rating"
                  checked={filters.minRating === option.value}
                  onChange={() => update({ minRating: filters.minRating === option.value ? 0 : option.value })}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-rose-600"
                />
                <span className="flex-1">{option.label}</span>
                <span className="text-xs text-gray-500">{counts[`rating:${option.value}`] || 0}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {renderCheckboxGroup("Loại chỗ ở", "propertyTypes", propertyTypeOptions)}

        <FilterSection title="Phòng ngủ và phòng tắm">
          <Stepper label="Phòng ngủ" value={filters.bedrooms} onChange={(value) => update({ bedrooms: value })} />
          <Stepper label="Phòng tắm" value={filters.bathrooms} onChange={(value) => update({ bathrooms: value })} />
        </FilterSection>

        {renderCheckboxGroup(
          "Tiện nghi",
          "amenities",
          showAllAmenities ? [...amenityBaseOptions, ...amenityMoreOptions] : amenityBaseOptions,
        )}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => setShowAllAmenities((value) => !value)}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            {showAllAmenities ? "Thu gọn" : "Hiển thị tất cả"}
          </button>
        </div>

        <FilterSection title={getCenterDistanceLabel(selectedCity)}>
          <div className="space-y-2">
            {distanceOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="distance"
                  checked={filters.maxDistanceKm === option.value}
                  onChange={() => update({ maxDistanceKm: filters.maxDistanceKm === option.value ? 0 : option.value })}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-rose-600"
                />
                <span className="flex-1">{option.label}</span>
                <span className="text-xs text-gray-500">{counts[`distance:${option.value}`] || 0}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {renderCheckboxGroup("Xếp hạng chỗ nghỉ", "starRatings", starOptions)}
        {renderCheckboxGroup("Tùy chọn giường", "bedOptions", bedOptions)}
        {renderCheckboxGroup("Bữa ăn", "meals", mealOptions)}
        {renderCheckboxGroup("Chính sách đặt phòng", "bookingPolicies", bookingPolicyOptions)}
      </div>
    </aside>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-gray-200 px-4 py-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="text-lg leading-none text-gray-500">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function RangeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <label>{label}</label>
        <span>
          {formatVnd(value)}
          {value >= PRICE_MAX ? "+" : ""}
        </span>
      </div>
      <input
        type="range"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={50000}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-rose-600"
      />
      <input
        type="number"
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={50000}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="rounded-full border border-gray-200 p-1.5 hover:bg-gray-50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          className="h-9 w-12 rounded-md border border-gray-200 text-center text-sm"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="rounded-full border border-gray-200 p-1.5 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
