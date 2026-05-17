import hotelsData from "@/data/dalat_listings.json";
import { locationHotelNames, fallbackHotelNames } from "@/data/location-hotel-names";
import { getLocationImage } from "@/lib/images/location-images";

export const supportedCities = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Lạt", "Nha Trang", "Đà Nẵng",
  "Hội An", "Phú Quốc", "Sapa", "Huế", "Cần Thơ", "Hạ Long",
  "Ninh Bình", "Vũng Tàu", "Quy Nhơn", "Mũi Né", "Hà Giang", "Cao Bằng",
];export interface HotelData {
  id: number;
  title: string;
  room_name: string;
  price: number | null;
  original_price?: number | null;
  discounted_price?: number | null;
  price_currency: string | null;
  image_src: string;
  image_local_path: string;
  image_public_path?: string;
  rating: number | null;
  reviews_count: number | null;
  remaining_rooms?: number | null;
  prepayment_policy?: string | null;
  free_cancellation?: boolean | null;
  no_prepayment?: boolean | null;
  bed_info?: string | null;
  availability_text?: string | null;
  link: string;
}

export interface Hotel extends HotelData {
  city: string;
  slug: string;
  displayRating: number;
  priceFormatted: string;
  originalPriceFormatted: string | null;
  imagePublicPath: string;
  galleryImages: string[];
  hotelType: string;
  roomTypeLabel: string;
  description: string;
  highlights: string[];
  distanceLabel: string;
  mapQuery: string;
}

const allHotels = hotelsData as HotelData[];

const publicImagePaths = allHotels.map((hotel) => {
  const fromJson = hotel.image_public_path?.trim();
  if (fromJson) return fromJson;

  const fileName = hotel.image_local_path
    ? hotel.image_local_path.split(/[\\/]/).pop()
    : hotel.image_src.split(/[\\/]/).pop();

  return fileName ? `/hotels/dalat/${fileName}` : "/images/fallback-hotel.jpg";
});

const getHotelTypeFromTitle = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("homestay")) return "Homestay";
  if (lower.includes("boutique")) return "Boutique Hotel";
  if (lower.includes("apartment") || lower.includes("apart'")) return "Apart Hotel";
  if (lower.includes("villa") || lower.includes("biệt thự")) return "Villa";
  if (lower.includes("resort")) return "Resort";
  if (lower.includes("studio")) return "Studio";
  return "Hotel";
};

const getCityFromTitle = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("da lat") || lower.includes("dalat") || lower.includes("đà lạt")) {
    return "Đà Lạt";
  }
  return "Đà Lạt";
};

const normalizeVnd = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return `VND ${value.toLocaleString("vi-VN")}`;
};

const getDescription = (hotel: HotelData, city: string) => {
  const room = hotel.room_name ? `Phòng ${hotel.room_name}` : "phòng lưu trú";
  return `${hotel.title} là khách sạn thật tại ${city}. ${room} đã được trích xuất từ dữ liệu crawl để hiển thị trên StaySaga.`;
};

const slugifyText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCityFromSlug = (slug?: string | null) => {
  if (!slug) return null;
  const normalizedSlug = String(slug).toLowerCase().trim();
  if (normalizedSlug.startsWith("da-lat")) return "Đà Lạt";
  if (normalizedSlug.startsWith("da-nang")) return "Đà Nẵng";
  if (normalizedSlug.startsWith("ha-noi")) return "Hà Nội";
  if (normalizedSlug.startsWith("ho-chi-minh") || normalizedSlug.startsWith("tp-ho-chi-minh")) {
    return "TP. Hồ Chí Minh";
  }
  if (normalizedSlug.startsWith("hoi-an")) return "Hội An";
  if (normalizedSlug.startsWith("nha-trang")) return "Nha Trang";
  if (normalizedSlug.startsWith("phu-quoc")) return "Phú Quốc";
  if (normalizedSlug.startsWith("sapa")) return "Sapa";
  return null;
};

const getHighlights = (hotel: HotelData) => {
  const items = [
    hotel.bed_info ? hotel.bed_info : null,
    hotel.prepayment_policy ? hotel.prepayment_policy : null,
    typeof hotel.remaining_rooms === "number" ? `Còn ${hotel.remaining_rooms} phòng` : null,
    hotel.rating ? `Đánh giá ${hotel.rating.toFixed(1)}` : null,
  ].filter(Boolean) as string[];

  return items.slice(0, 4);
};

const getGalleryImages = (index: number) => {
  const candidates = [
    publicImagePaths[index],
    publicImagePaths[index + 1],
    publicImagePaths[index + 2],
    publicImagePaths[index + 3],
  ].filter(Boolean);

  const fallback = publicImagePaths.slice(0, 4);
  const merged = Array.from(new Set([...candidates, ...fallback]));
  return merged.length > 0 ? merged : ["/images/fallback-hotel.jpg"];
};

export const parseHotelData = (rawHotel: HotelData, index: number): Hotel => {
  const city = getCityFromTitle(rawHotel.title);
  const slug = `${slugifyText(rawHotel.title)}-${rawHotel.id}`;
  const imagePublicPath = rawHotel.image_public_path || publicImagePaths[index] || "/images/fallback-hotel.jpg";
  const price = rawHotel.discounted_price ?? rawHotel.price;
  const originalPrice = rawHotel.original_price ?? null;
  const displayRating = rawHotel.rating ?? (rawHotel.reviews_count && rawHotel.reviews_count > 0 ? 4.5 : 0);
  const roomTypeLabel = rawHotel.room_name || "Phòng tiêu chuẩn";

  return {
    ...rawHotel,
    city,
    slug,
    displayRating,
    priceFormatted: normalizeVnd(price) || "VND 0",
    originalPriceFormatted: normalizeVnd(originalPrice),
    imagePublicPath,
    galleryImages: getGalleryImages(index),
    hotelType: getHotelTypeFromTitle(rawHotel.title),
    roomTypeLabel,
    description: getDescription(rawHotel, city),
    highlights: getHighlights(rawHotel),
    distanceLabel: "Chưa có dữ liệu khoảng cách trong crawl",
    mapQuery: encodeURIComponent(`${rawHotel.title} ${city}`),
  };
};

export const getAllHotels = (): Hotel[] => {
  const dalatHotels = allHotels.map((hotel, index) => parseHotelData(hotel, index));
  
  const otherCitiesHotels: Hotel[] = [];
  supportedCities.filter(c => c !== "Đà Lạt").forEach(city => {
    const cityNames = locationHotelNames[city] || fallbackHotelNames;
    const slice = dalatHotels.slice(0, 12);
    slice.forEach((hotel, index) => {
      const title = cityNames[index % cityNames.length] || hotel.title;
      otherCitiesHotels.push({
        ...hotel,
        id: 10000 + otherCitiesHotels.length, // unique ID
        title,
        city,
        slug: `${slugifyText(city)}-${slugifyText(title)}`,
        imagePublicPath: getLocationImage(city, index),
        galleryImages: [getLocationImage(city, index), ...hotel.galleryImages],
        description: `${hotel.hotelType} tại ${city}, phù hợp cho kỳ nghỉ hoặc chuyến công tác.`,
        mapQuery: encodeURIComponent(`${title} ${city}`),
      });
    });
  });

  return [...dalatHotels, ...otherCitiesHotels];
};

export const getHotelsByCity = (city: string): Hotel[] => {
  return getAllHotels().filter((hotel) => hotel.city === city);
};

export const getHotelBySlug = (slug?: string | null): Hotel | null => {
  if (!slug) return null;
  const hotels = getAllHotels();
  const directMatch = hotels.find((hotel) => hotel.slug === slug);
  if (directMatch) return directMatch;

  const city = getCityFromSlug(slug);
  if (city) {
    const cityMatch = hotels.find((hotel) => hotel.city === city);
    if (cityMatch) return cityMatch;
  }

  const normalizedSlug = slugifyText(String(slug));
  const legacyMatch = hotels.find((hotel) => slugifyText(hotel.title) === normalizedSlug);
  return legacyMatch || null;
};

export const getHotelById = (id: number): Hotel | null => {
  const hotel = getAllHotels().find((item) => item.id === id);
  return hotel || null;
};

export const getAvailableCities = (): string[] => {
  return Array.from(new Set(getAllHotels().map((hotel) => hotel.city)));
};

export const formatVnd = (value: number | null | undefined) => normalizeVnd(value);

/**
 * Resolve various incoming slugs (including legacy/mock slugs like "da-lat-01")
 * to a canonical hotel slug present in the crawl dataset. Returns null if
 * no suitable mapping is found.
 */
export const resolveToCanonicalSlug = (incoming?: string | null): string | null => {
  if (!incoming) return null;
  const s = incoming.trim();

  // Direct exact match first
  const hotels = getAllHotels();
  const direct = hotels.find((h) => h.slug === s);
  if (direct) return direct.slug;

  // If incoming looks like city-style legacy slug (e.g. da-lat-01), try detect city
  const city = getCityFromSlug(s);
  if (city) {
    const cityHotel = hotels.find((h) => h.city === city);
    if (cityHotel) return cityHotel.slug;
  }

  // Try normalized-title match (legacy where slug might be title-only)
  const normalizedIncoming = slugifyText(s);
  const byTitle = hotels.find((h) => slugifyText(h.title) === normalizedIncoming);
  if (byTitle) return byTitle.slug;

  return null;
};
