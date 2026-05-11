import { Star, MapPin, Wifi, Coffee, Car, Wind, Shield } from "lucide-react";
import { getPropertyBySlug } from "@/core/properties/actions";
import { getFavoriteIds } from "@/core/favorites/actions";
import { BookingWidget } from "@/components/features/booking/BookingWidget";
import FavoriteButton from "@/components/features/favorites/FavoriteButton";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function HomestayDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { data: homestay } = await getPropertyBySlug(resolvedParams.slug);

  if (!homestay) {
    return notFound();
  }

  const favoriteIds = await getFavoriteIds([homestay.id]);
  const isFavorited = favoriteIds.includes(homestay.id);

  // Lấy ảnh chính và ảnh phụ
  const mainImage =
    homestay.image ||
    (homestay as any).images?.[0]?.url ||
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2000";
  const subImages = [
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=1000",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1000",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1000",
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {homestay.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-gray-900 dark:text-white">
                  {homestay.rating || "4.9"}
                </span>
                <span className="underline cursor-pointer">
                  ({(homestay as any).reviews || 128} đánh giá)
                </span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span className="underline cursor-pointer">
                  {homestay.location}, Việt Nam
                </span>
              </div>
            </div>
          </div>
          <FavoriteButton
            propertyId={homestay.id}
            initialFavorited={isFavorited}
            className="border border-gray-200 dark:border-zinc-800 p-2 bg-white/90 dark:bg-zinc-900/80 hover:bg-gray-50 dark:hover:bg-zinc-900"
          />
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh] min-h-[400px] mb-12 rounded-3xl overflow-hidden">
          <div className="relative h-full w-full cursor-pointer hover:opacity-95 transition-opacity">
            <img
              src={mainImage}
              className="w-full h-full object-cover"
              alt="Main"
            />
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full hidden md:grid">
            {subImages.map((img, i) => (
              <img
                key={i}
                src={img}
                className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                alt={`Room ${i}`}
              />
            ))}
          </div>
        </div>

        {/* Content & Booking Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center pb-8 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Toàn bộ biệt thự, chủ nhà Nguyễn Văn A
                </h2>
                <p className="text-gray-600">
                  8 khách · 4 phòng ngủ · 4 giường · 3 phòng tắm
                </p>
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden">
                <img
                  src="https://ui-avatars.com/api/?name=Nguyen+A&background=random"
                  alt="Host"
                />
              </div>
            </div>

            <div className="py-8 border-b border-gray-200 dark:border-zinc-800 space-y-6">
              <div className="flex gap-4">
                <Shield className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Chủ nhà siêu cấp</h3>
                  <p className="text-gray-500">
                    Chủ nhà siêu cấp là những người có kinh nghiệm, được đánh
                    giá cao và cam kết mang lại kỳ nghỉ tuyệt vời cho khách.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <MapPin className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Vị trí tuyệt vời</h3>
                  <p className="text-gray-500">
                    100% khách gần đây đã xếp hạng 5 sao cho vị trí này.
                  </p>
                </div>
              </div>
            </div>

            <div className="py-8 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-2xl font-bold mb-6">Tiện nghi có sẵn</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Wifi className="w-6 h-6 text-gray-400" />{" "}
                  <span>Wifi tốc độ cao</span>
                </div>
                <div className="flex items-center gap-3">
                  <Wind className="w-6 h-6 text-gray-400" />{" "}
                  <span>Điều hòa nhiệt độ</span>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-6 h-6 text-gray-400" />{" "}
                  <span>Bãi đỗ xe miễn phí</span>
                </div>
                <div className="flex items-center gap-3">
                  <Coffee className="w-6 h-6 text-gray-400" />{" "}
                  <span>Bếp đầy đủ tiện nghi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="relative">
            <BookingWidget
              propertyId={homestay.id}
              basePrice={homestay.price || (homestay as any).base_price || 0}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
