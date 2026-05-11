"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchParams = {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
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

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000",
  "https://images.unsplash.com/photo-1501117716987-c8e1ecb210a7?q=80&w=2000",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=2000",
  "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=2000",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2000",
  "https://images.unsplash.com/photo-1502672260266-1c1e525044c7?q=80&w=2000",
  "https://images.unsplash.com/photo-1560067174-89451c3b89f2?q=80&w=2000",
  "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?q=80&w=2000",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000",
  "https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=2000",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2000",
  "https://images.unsplash.com/photo-1560185127-6a8c1d1b1d70?q=80&w=2000",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=2000",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2000",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000",
  "https://images.unsplash.com/photo-1502005097973-6a7082348e28?q=80&w=2000",
  "https://images.unsplash.com/photo-1469796466635-455ede028aca?q=80&w=2000",
  "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=2000",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000",
  "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?q=80&w=2000",
];

const CITY_IMAGE_POOL: Record<string, string[]> = {
  "tp ho chi minh": HOTEL_IMAGES.slice(0, 5),
  "ha noi": HOTEL_IMAGES.slice(5, 10),
  "da lat": HOTEL_IMAGES.slice(10, 15),
  "nha trang": HOTEL_IMAGES.slice(15, 20),
  "da nang": HOTEL_IMAGES.slice(2, 7),
  "phu quoc": HOTEL_IMAGES.slice(7, 12),
  "hoi an": HOTEL_IMAGES.slice(12, 17),
  sapa: HOTEL_IMAGES.slice(3, 8),
  default: HOTEL_IMAGES.slice(0, 5),
};

const getCityKey = (city?: string) => {
  if (!city) return "default";
  const normalized = removeVietnameseTones(city);
  if (normalized.includes("ho chi minh") || normalized.includes("hcm"))
    return "tp ho chi minh";
  if (normalized.includes("ha noi")) return "ha noi";
  if (normalized.includes("da lat")) return "da lat";
  if (normalized.includes("nha trang")) return "nha trang";
  if (normalized.includes("da nang")) return "da nang";
  if (normalized.includes("phu quoc")) return "phu quoc";
  if (normalized.includes("hoi an")) return "hoi an";
  if (normalized.includes("sapa")) return "sapa";
  return "default";
};

const getCityImagePool = (city?: string) => {
  const key = getCityKey(city);
  return CITY_IMAGE_POOL[key] || CITY_IMAGE_POOL.default;
};

const getCityFallbackImage = (city?: string, index = 0) => {
  const pool = getCityImagePool(city);
  return pool[index % pool.length];
};

const buildMockProperties = () => {
  const items: any[] = [];

  MOCK_CITIES.forEach((city, cityIndex) => {
    for (let i = 1; i <= MOCK_PER_CITY; i += 1) {
      const namePart =
        MOCK_NAME_PARTS[(i + cityIndex) % MOCK_NAME_PARTS.length];
      const tag = MOCK_TAGS[(i * 2 + cityIndex) % MOCK_TAGS.length];
      const slugIndex = String(i).padStart(2, "0");
      const rating = 4.5 + ((i + cityIndex) % 5) * 0.1;
      const price = city.basePrice + ((i + cityIndex) % 12) * 150000;
      const maxGuests = 2 + ((i + cityIndex) % 6);
      const bedrooms = 1 + ((i + cityIndex) % 4);
      const beds = bedrooms + ((i + cityIndex) % 2);
      const bathrooms = 1 + ((i + cityIndex) % 3);
      const amenityStart = (i + cityIndex) % (MOCK_AMENITIES.length - 4);
      const amenities = MOCK_AMENITIES.slice(amenityStart, amenityStart + 4);
      const image = getCityFallbackImage(city.name, i + cityIndex);

      items.push({
        id: `mock-${city.slug}-${i}`,
        slug: `${city.slug}-${slugIndex}`,
        title: `${namePart} ${tag} ${city.shortName}`,
        location: city.name,
        price,
        rating: Number(rating.toFixed(1)),
        image,
        amenities,
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
function normalizeHomestay(row: any) {
  const seedSource = String(row.id || row.slug || row.city || "");
  const seed = seedSource
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const fallbackImage = getCityFallbackImage(row.city, seed);
  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    location: row.city,
    price: Number(row.price_per_night),
    rating: row.avg_rating || 4.9,
    image: row.homestay_images?.[0]?.url || fallbackImage,
    amenities: row.homestay_amenities?.map((a: any) => a.amenities?.name) || [],
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
    page = 1,
  } = params;
  const limit = 9;
  const offset = (page - 1) * limit;
  const hasDateRange = Boolean(
    checkIn &&
    checkOut &&
    !Number.isNaN(Date.parse(checkIn)) &&
    !Number.isNaN(Date.parse(checkOut)) &&
    new Date(checkOut) > new Date(checkIn),
  );
  const hasFilters = Boolean(
    location || guests || minPrice || maxPrice || hasDateRange,
  );

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
        .lte("check_in_date", checkOut)
        .gte("check_out_date", checkIn);

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

    const { data, error, count } = await query
      .eq("is_active", true)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      const filtered = applyMockFilters();
      return {
        properties: filtered.slice(offset, offset + limit),
        total: filtered.length,
        isMock: true,
      };
    }

    return {
      properties: data.map(normalizeHomestay),
      total: count || 0,
      isMock: false,
    };
  } catch (err) {
    console.error("Lỗi fetch properties:", err);
    return {
      properties: mockProperties,
      total: mockProperties.length,
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
    return { data: mock || null, isMock: true };
  }

  return { data: normalizeHomestay(data), isMock: false };
}
