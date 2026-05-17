"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getLocationImage,
} from "@/lib/images/location-images";

const getCityFallbackImage = (city: string, seed: number) => {
  // Dùng chung hệ fallback theo vị trí (không phụ thuộc Supabase storage URL)
  return getLocationImage(city, seed);
};

export type SearchParams = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  types?: string[];
  amenities?: string[];
  policies?: string[];
  distanceMax?: number;
  page?: number;
};

// Hàm loại bỏ dấu tiếng Việt để tìm kiếm chính xác
const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.toLowerCase().replace(/\s+/g, " ").trim();
};

const getSeedFromString = (value: string) =>
  value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

const getDistanceKm = (seed: number) =>
  Number(((seed % 80) / 10 + 0.5).toFixed(1));

const getPolicyFlags = (seed: number) => ({
  freeCancellation: seed % 2 === 0,
  payAtHotel: seed % 3 === 0,
  noCreditCard: seed % 4 === 0,
  breakfastIncluded: seed % 5 === 0,
});

const TYPE_KEYWORDS: Record<string, string[]> = {
  hotel: ["khach san", "hotel"],
  apartment: ["can ho", "apartment"],
  homestay: ["homestay"],
  villa: ["villa", "biet thu"],
  resort: ["resort"],
};

const POLICY_KEYS: Record<string, keyof ReturnType<typeof getPolicyFlags>> = {
  free_cancellation: "freeCancellation",
  pay_at_hotel: "payAtHotel",
  no_credit_card: "noCreditCard",
  breakfast: "breakfastIncluded",
};

// Dữ liệu Mẫu (Fallback khi DB chưa có data)
const MOCK_PER_CITY = 50;
const MOCK_CITIES = [
  {
    name: "TP. Hồ Chí Minh",
    slug: "tp-ho-chi-minh",
    shortName: "TP HCM",
    basePrice: 950000,
  },
  {
    name: "Hà Nội",
    slug: "ha-noi",
    shortName: "Hà Nội",
    basePrice: 880000,
  },
  {
    name: "Đà Lạt",
    slug: "da-lat",
    shortName: "Đà Lạt",
    basePrice: 720000,
  },
  {
    name: "Nha Trang",
    slug: "nha-trang",
    shortName: "Nha Trang",
    basePrice: 980000,
  },
  {
    name: "Đà Nẵng",
    slug: "da-nang",
    shortName: "Đà Nẵng",
    basePrice: 1020000,
  },
  {
    name: "Phú Quốc",
    slug: "phu-quoc",
    shortName: "Phú Quốc",
    basePrice: 1200000,
  },
  {
    name: "Hội An",
    slug: "hoi-an",
    shortName: "Hội An",
    basePrice: 830000,
  },
  {
    name: "Sapa",
    slug: "sapa",
    shortName: "Sapa",
    basePrice: 760000,
  },
];

const MOCK_NAME_PARTS = [
  "Homestay",
  "Villa",
  "Resort",
  "Căn hộ",
  "Nhà gỗ",
  "Studio",
  "Khách sạn",
  "Boutique",
  "Biệt thự",
  "Retreat",
  "Bungalow",
  "Farmstay",
];

const MOCK_TAGS = [
  "view biển",
  "view núi",
  "gần trung tâm",
  "sân vườn",
  "hồ bơi",
  "phong cách Nhật",
  "thiết kế tối giản",
  "ấm cúng",
  "cao cấp",
  "ven hồ",
  "ven sông",
  "yên tĩnh",
];

const MOCK_AMENITIES = [
  "wifi",
  "parking",
  "kitchen",
  "pool",
  "bbq",
  "garden",
  "gym",
  "beach",
  "mountain_view",
  "ac",
  "breakfast",
  "balcony",
  "lake_view",
];

const buildMockProperties = () => {
  const items: any[] = [];

  MOCK_CITIES.forEach((city, cityIndex) => {
    for (let i = 1; i <= MOCK_PER_CITY; i += 1) {
      const namePart =
        MOCK_NAME_PARTS[(i + cityIndex) % MOCK_NAME_PARTS.length];
      const tag = MOCK_TAGS[(i * 2 + cityIndex) % MOCK_TAGS.length];
      const slugIndex = String(i).padStart(2, "0");
      const rating = 4.5 + ((i + cityIndex) % 5) * 0.1;
      // Deterministic pseudo-random price between 150k and 2,000k
      const seed = getSeedFromString(`${city.slug}-${i}`);
      const PRICE_MIN = 150000;
      const PRICE_MAX = 2000000;
      const price = PRICE_MIN + ((seed * 73939) % (PRICE_MAX - PRICE_MIN + 1));
      const maxGuests = 2 + ((i + cityIndex) % 6);
      const bedrooms = 1 + ((i + cityIndex) % 4);
      const beds = bedrooms + ((i + cityIndex) % 2);
      const bathrooms = 1 + ((i + cityIndex) % 3);
      const amenityStart = (i + cityIndex) % (MOCK_AMENITIES.length - 4);
      const amenities = MOCK_AMENITIES.slice(amenityStart, amenityStart + 4);
      const image = getLocationImage(city.name, seed + i);
      const images = Array.from({ length: 4 }, (_, k) =>
        getLocationImage(city.name, seed + i + k),
      );
      const policies = getPolicyFlags(seed);
      const distance_km = getDistanceKm(seed);

      items.push({
        id: `mock-${city.slug}-${i}`,
        slug: `${city.slug}-${slugIndex}`,
        title: `${namePart} ${tag} ${city.shortName}`,
        location: city.name,
        price,
        rating: Number(rating.toFixed(1)),
        image,
        images: images.map((url: string) => ({ url })),
        amenities,
        policies,
        distance_km,
        max_guests: maxGuests,
        bedrooms,
        beds,
        bathrooms,
      });
    }
  });

  return items;
};

const mockProperties = buildMockProperties();

/**
 * Chuẩn hoá dữ liệu từ DB về dạng thống nhất mà UI hiểu được
 */

// Force listings to appear as hotels in Đà Lạt (keep dynamic prices)
const ensureHotelTitle = (title: string | undefined) => {
  if (!title) return "Khách sạn";
  return /khách sạn/i.test(title) ? title : `Khách sạn ${title}`;
};

const normalizeListingDisplay = (p: any) => {
  const price = Number(p.price ?? p.price_per_night ?? 0) || 0;
  return {
    ...p,
    location: p.location ?? p.city,
    title: ensureHotelTitle(p.title),
    price,
  };
};


function normalizeHomestay(row: any) {
  const seedSource = String(row.id || row.slug || row.city || "");
  const seed = getSeedFromString(seedSource);
  const fallbackImage = getCityFallbackImage(row.city, seed);
  const policies = getPolicyFlags(seed);
  const distance_km = getDistanceKm(seed);
  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    location: row.city,
    price: Number(row.price_per_night),
    rating: row.avg_rating || 4.9,
    image: row.homestay_images?.[0]?.url ?? fallbackImage,
    images: (row.homestay_images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      storage_path: img.storage_path,
    })),
    amenities: row.homestay_amenities?.map((a: any) => a.amenities?.name) || [],
    policies,
    distance_km,
    max_guests: row.max_guests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    description: row.description,
    owner_id: row.owner_id,
  };
}

/**
 * Lấy danh sách homestay kèm tính năng phân trang và lọc động
 */
export async function getProperties(params: SearchParams) {
  const supabase = await createClient();
  const {
    location,
    checkIn,
    checkOut,
    guests,
    minPrice,
    maxPrice,
    minRating,
    sort,
    types,
    amenities,
    policies,
    distanceMax,
    page = 1,
  } = params;
  const typeFilters = types?.filter(Boolean) || [];
  const amenityFilters = amenities?.filter(Boolean) || [];
  const policyFilters = policies?.filter(Boolean) || [];
  const hasExtraFilters = Boolean(
    typeFilters.length ||
    amenityFilters.length ||
    policyFilters.length ||
    distanceMax,
  );
  const limit = 9;
  const offset = (page - 1) * limit;
  const hasDateRange = Boolean(
    checkIn &&
    checkOut &&
    !Number.isNaN(Date.parse(checkIn)) &&
    !Number.isNaN(Date.parse(checkOut)) &&
    new Date(checkOut) > new Date(checkIn),
  );
  const matchesTypeFilters = (title?: string) => {
    if (typeFilters.length === 0) return true;
    const normalizedTitle = removeVietnameseTones(title || "");
    return typeFilters.some((type) => {
      const keywords = TYPE_KEYWORDS[type] || [];
      return keywords.some((keyword) => normalizedTitle.includes(keyword));
    });
  };

  const matchesAmenityFilters = (list?: string[]) => {
    if (amenityFilters.length === 0) return true;
    const amenityList = list || [];
    return amenityFilters.every((amenity) => amenityList.includes(amenity));
  };

  const matchesPolicyFilters = (flags?: ReturnType<typeof getPolicyFlags>) => {
    if (policyFilters.length === 0) return true;
    if (!flags) return false;
    return policyFilters.every((policy) => {
      const key = POLICY_KEYS[policy];
      return key ? Boolean(flags[key]) : false;
    });
  };

  const matchesDistanceFilter = (distance?: number) => {
    if (!distanceMax) return true;
    if (!distance) return false;
    return distance <= distanceMax;
  };

  const applyMockFilters = () => {
    let filtered = [...mockProperties];

    if (location) {
      const searchNormalized = removeVietnameseTones(location);
      filtered = filtered.filter(
        (p) =>
          removeVietnameseTones(p.location).includes(searchNormalized) ||
          removeVietnameseTones(p.title).includes(searchNormalized),
      );
    }
    if (guests)
      filtered = filtered.filter((p) =>
        (p as any).max_guests ? (p as any).max_guests >= guests : true,
      );
    if (minPrice) filtered = filtered.filter((p) => p.price >= minPrice);
    if (maxPrice) filtered = filtered.filter((p) => p.price <= maxPrice);
    if (minRating) filtered = filtered.filter((p) => p.rating >= minRating);

    filtered = filtered.filter(
      (p) =>
        matchesTypeFilters(p.title) &&
        matchesAmenityFilters((p as any).amenities) &&
        matchesPolicyFilters((p as any).policies) &&
        matchesDistanceFilter((p as any).distance_km),
    );

    if (sort === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "rating_desc") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  try {
    let query = supabase
      .from("homestays")
      .select("*, homestay_images(*)", { count: "exact" });

    if (hasDateRange) {
      const { data: overlapping, error: overlapError } = await supabase
        .from("bookings")
        .select("homestay_id")
        .in("status", ["PENDING", "CONFIRMED"])
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn);

      if (!overlapError && overlapping && overlapping.length > 0) {
        const blockedIds = Array.from(
          new Set(
            overlapping.map((row: any) => row.homestay_id).filter(Boolean),
          ),
        );
        if (blockedIds.length > 0) {
          const blockedList = blockedIds.map((id) => `"${id}"`).join(",");
          query = query.not("id", "in", `(${blockedList})`);
        }
      }
    }

    if (location) {
      query = query.ilike("city", `%${location}%`);
    }
    if (guests) query = query.gte("max_guests", guests);
    if (minPrice) query = query.gte("price_per_night", minPrice);
    if (maxPrice) query = query.lte("price_per_night", maxPrice);
    if (minRating) query = query.gte("avg_rating", minRating);

    let orderBy = "created_at";
    let ascending = false;

    if (sort === "price_asc") {
      orderBy = "price_per_night";
      ascending = true;
    } else if (sort === "price_desc") {
      orderBy = "price_per_night";
      ascending = false;
    } else if (sort === "rating_desc") {
      orderBy = "avg_rating";
      ascending = false;
    }

    const { data, error, count } = await query
      .eq("is_active", true)
      .range(offset, offset + limit - 1)
      .order(orderBy, { ascending });

    if (error || !data || data.length === 0) {
      const filtered = applyMockFilters();
      const enforced = filtered.map(normalizeListingDisplay);
      return {
        properties: enforced.slice(offset, offset + limit),
        total: enforced.length,
        isMock: true,
      };
    }

    const normalized = data.map(normalizeHomestay);
    const filtered = hasExtraFilters
      ? normalized.filter(
          (p) =>
            matchesTypeFilters(p.title) &&
            matchesAmenityFilters(p.amenities) &&
            matchesPolicyFilters((p as any).policies) &&
            matchesDistanceFilter((p as any).distance_km),
        )
      : normalized;

    const adjusted = filtered.map(normalizeListingDisplay);

    return {
      properties: adjusted,
      total: hasExtraFilters ? adjusted.length : count || 0,
      isMock: false,
    };
  } catch (err) {
    console.error("Lỗi fetch properties:", err);
    const filtered = applyMockFilters();
    const enforcedMock = filtered.map(normalizeListingDisplay);
    return {
      properties: enforcedMock.slice(offset, offset + limit),
      total: enforcedMock.length,
      isMock: true,
    };
  }
}

/**
 * Lấy chi tiết 1 homestay dựa vào Slug
 */
export async function getPropertyBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("homestays")
    .select(
      "*, owner:profiles(*), homestay_amenities(amenities(*)), homestay_images(*)",
    )
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single();

  if (error || !data) {
    const mock = mockProperties.find((p) => p.slug === slug || p.id === slug);
    if (mock) return { data: normalizeListingDisplay(mock), isMock: true };
    
    // Fallback to hotel-parser (dalat_listings.json)
    const { getHotelBySlug } = await import("@/lib/hotel-parser");
    const jsonHotel = getHotelBySlug(slug);
    if (jsonHotel) {
      return { 
        data: {
          ...jsonHotel,
          price: Number(jsonHotel.price?.toString().replace(/\D/g, "") || 0),
          image: jsonHotel.imagePublicPath,
          location: jsonHotel.city,
        }, 
        isMock: true 
      };
    }
    return { data: null, isMock: true };
  }

  return { data: normalizeListingDisplay(normalizeHomestay(data)), isMock: false };
}
