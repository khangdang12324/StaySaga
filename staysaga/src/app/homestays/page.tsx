import { Star, MapPin, Filter } from "lucide-react";
import Link from "next/link";
import { getProperties } from "@/core/properties/actions";
import { getFavoriteIds } from "@/core/favorites/actions";
import FavoriteButton from "@/components/features/favorites/FavoriteButton";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomestaysPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const location =
    typeof resolvedParams.location === "string"
      ? resolvedParams.location
      : undefined;
  const guests =
    typeof resolvedParams.guests === "string"
      ? parseInt(resolvedParams.guests)
      : undefined;
  const minPrice =
    typeof resolvedParams.minPrice === "string"
      ? parseInt(resolvedParams.minPrice)
      : undefined;
  const maxPrice =
    typeof resolvedParams.maxPrice === "string"
      ? parseInt(resolvedParams.maxPrice)
      : undefined;
  const checkIn =
    typeof resolvedParams.checkIn === "string"
      ? resolvedParams.checkIn
      : undefined;
  const checkOut =
    typeof resolvedParams.checkOut === "string"
      ? resolvedParams.checkOut
      : undefined;

  const detailParams = new URLSearchParams();
  if (checkIn) detailParams.set("checkIn", checkIn);
  if (checkOut) detailParams.set("checkOut", checkOut);
  if (typeof guests === "number" && !Number.isNaN(guests)) {
    detailParams.set("guests", String(guests));
  }
  const detailQuery = detailParams.toString();

  const { properties, total } = await getProperties({
    location,
    checkIn,
    checkOut,
    guests,
    minPrice,
    maxPrice,
  });
  const favoriteIds = await getFavoriteIds(properties.map((p: any) => p.id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {location
                ? `Tìm thấy ${total} chỗ ở tại "${location}"`
                : "Khám phá tất cả Homestays"}
            </h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full hover:shadow-md transition-shadow">
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Bộ lọc nâng cao</span>
          </button>
        </div>

        {/* Grid */}
        {properties.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-500">
              Không tìm thấy homestay nào phù hợp.
            </h2>
            <p className="text-gray-400 mt-2">
              Vui lòng thử nghiệm lại với từ khóa khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((homestay: any) => {
              const isFavorited = favoriteIds.includes(homestay.id);
              return (
                <Link
                  href={
                    detailQuery
                      ? `/homestays/${homestay.slug}?${detailQuery}`
                      : `/homestays/${homestay.slug}`
                  }
                  key={homestay.id}
                  className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-zinc-800"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={
                        homestay.image ||
                        homestay.property_images?.[0]?.url ||
                        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000"
                      }
                      alt={homestay.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <FavoriteButton
                      propertyId={homestay.id}
                      initialFavorited={isFavorited}
                      className="absolute top-4 right-4 bg-white/85 backdrop-blur-sm p-2 shadow-md"
                    />
                    {homestay.price < 2000000 && (
                      <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        Giá tốt
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                        {homestay.title}
                      </h3>
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800 px-2 py-1 rounded-md">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">
                          {homestay.rating || "4.9"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{homestay.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xl font-black text-rose-600">
                          {(
                            homestay.price || homestay.base_price
                          ).toLocaleString("vi-VN")}
                          đ
                        </span>
                        <span className="text-gray-500 text-sm"> /đêm</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
