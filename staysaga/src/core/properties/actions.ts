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
const mockProperties = [
  {
    id: "1",
    slug: "cabin-da-lat-1",
    title: "Cabin Gỗ Giữa Rừng Thông",
    location: "Đà Lạt",
    price: 1200000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=2000",
    amenities: ["wifi", "parking", "kitchen"],
  },
  {
    id: "2",
    slug: "villa-da-lat-2",
    title: "Biệt thự cổ kính Pháp",
    location: "Đà Lạt",
    price: 3500000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000",
    amenities: ["wifi", "garden", "bbq"],
  },
  {
    id: "3",
    slug: "hanoi-old-quarter",
    title: "Căn hộ Phố Cổ Hà Nội",
    location: "Hà Nội",
    price: 850000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000",
    amenities: ["wifi", "ac"],
  },
  {
    id: "4",
    slug: "hanoi-west-lake",
    title: "Penthouse View Hồ Tây",
    location: "Hà Nội",
    price: 4200000,
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1e525044c7?q=80&w=2000",
    amenities: ["wifi", "pool", "gym"],
  },
  {
    id: "5",
    slug: "hcm-district-1",
    title: "Studio Trung tâm Quận 1",
    location: "Hồ Chí Minh",
    price: 1100000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000",
    amenities: ["wifi", "gym", "kitchen"],
  },
  {
    id: "6",
    slug: "hcm-landmark",
    title: "Căn hộ cao cấp Landmark 81",
    location: "Hồ Chí Minh",
    price: 2500000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000",
    amenities: ["wifi", "pool", "gym", "view"],
  },
  {
    id: "7",
    slug: "danang-my-khe",
    title: "Căn hộ mặt biển Mỹ Khê",
    location: "Đà Nẵng",
    price: 1500000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2000",
    amenities: ["wifi", "pool", "beach"],
  },
  {
    id: "8",
    slug: "danang-han-river",
    title: "Villa Sông Hàn",
    location: "Đà Nẵng",
    price: 3000000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2000",
    amenities: ["wifi", "pool"],
  },
  {
    id: "9",
    slug: "nhatrang-beach",
    title: "Biệt thự Vịnh Nha Trang",
    location: "Nha Trang",
    price: 2800000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000",
    amenities: ["wifi", "pool", "beach"],
  },
  {
    id: "10",
    slug: "hoian-heritage",
    title: "Hoi An Heritage House",
    location: "Hội An",
    price: 1300000,
    rating: 5.0,
    image:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2000",
    amenities: ["wifi", "bicycle"],
  },
  {
    id: "11",
    slug: "phuquoc-resort",
    title: "Villa Hồ Bơi Riêng Phú Quốc",
    location: "Phú Quốc",
    price: 5500000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=2000",
    amenities: ["wifi", "private_pool", "beach"],
  },
  {
    id: "12",
    slug: "vungtau-hill",
    title: "Biệt Thự Đồi Vũng Tàu",
    location: "Vũng Tàu",
    price: 4000000,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2000",
    amenities: ["wifi", "pool", "bbq"],
  },
  {
    id: "13",
    slug: "sapa-eco",
    title: "Sapa Eco Retreat View Núi",
    location: "Sapa",
    price: 1800000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1470165301023-58dab8118cc9?q=80&w=2000",
    amenities: ["wifi", "heater", "mountain_view"],
  },
  {
    id: "14",
    slug: "halong-bay",
    title: "Du thuyền 5 Sao Hạ Long",
    location: "Hạ Long",
    price: 8000000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?q=80&w=2000",
    amenities: ["wifi", "restaurant", "ocean_view"],
  },
  {
    id: "15",
    slug: "hue-imperial",
    title: "Nhà Vườn Xứ Huế",
    location: "Huế",
    price: 1200000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2000",
    amenities: ["wifi", "garden", "bicycle"],
  },
];

/**
 * Chuẩn hoá dữ liệu từ DB về dạng thống nhất mà UI hiểu được
 */
function normalizeHomestay(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    location: row.city,
    price: Number(row.price_per_night),
    rating: row.avg_rating || 4.9,
    image: row.homestay_images?.[0]?.url || null,
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
  const { location, guests, minPrice, maxPrice, page = 1 } = params;
  const limit = 9;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("homestays")
      .select("*, homestay_images(*)", { count: "exact" });

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
      // Fallback sang Mock Data
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
    .eq("slug", slug)
    .single();

  if (error || !data) {
    const mock = mockProperties.find((p) => p.slug === slug);
    return { data: mock || null, isMock: true };
  }

  return { data: normalizeHomestay(data), isMock: false };
}
