import { HomestaysClient } from "./HomestaysClient";
import { getLocationImage } from "@/lib/images/location-images";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/hotel-parser";

type HomestaysPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeCity = (value: string) =>
  normalizeText(value).replace(/^(tp|thanh pho)\s+/, "");

const slugifyText = (value: string) =>
  normalizeText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

async function getHostHotels(location: string): Promise<Hotel[]> {
  if (!location.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homestays")
    .select("*, homestay_images(*)")
    .eq("is_active", true)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const requestedCity = normalizeCity(location);

  return data
    .filter((row) => normalizeCity(String(row.city || "")) === requestedCity)
    .map((row, index) => {
      const city = String(row.city || location);
      const title = String(row.name || "Homestay");
      const price = toNumber(row.price_per_night, 0);
      const image =
        row.homestay_images?.[0]?.url || getLocationImage(city, index);
      const slug = String(row.slug || row.id || `${slugifyText(title)}-${index}`);

      return {
        id: row.id,
        title,
        room_name: row.room_name || "Phòng tiêu chuẩn",
        price,
        original_price: null,
        discounted_price: price,
        price_currency: "VND",
        image_src: image,
        image_local_path: image,
        image_public_path: image,
        rating: toNumber(row.avg_rating, 4.8),
        reviews_count: toNumber(row.reviews_count, 0),
        remaining_rooms: null,
        prepayment_policy: null,
        free_cancellation: true,
        no_prepayment: true,
        bed_info: row.beds ? `${row.beds} giường` : "Giường đôi hoặc hai giường đơn",
        availability_text: null,
        link: `/homestays/${slug}`,
        city,
        slug,
        displayRating: toNumber(row.avg_rating, 4.8),
        priceFormatted: `VND ${price.toLocaleString("vi-VN")}`,
        originalPriceFormatted: null,
        imagePublicPath: image,
        galleryImages:
          row.homestay_images?.map((item: { url?: string | null }) => item.url).filter(Boolean) ||
          [image],
        hotelType: row.property_type || "Homestay",
        roomTypeLabel: row.room_name || "Phòng tiêu chuẩn",
        description: row.description || `${title} tại ${city}`,
        highlights: [],
        distanceLabel: "Gần trung tâm",
        mapQuery: encodeURIComponent(`${title} ${city}`),
      } as Hotel;
    });
}

export default async function HomestaysPage({ searchParams }: HomestaysPageProps) {
  const params = await searchParams;
  const location = firstParam(params.location)?.trim() || "";
  const hostHotels = await getHostHotels(location);

  return <HomestaysClient hostHotels={hostHotels} />;
}
