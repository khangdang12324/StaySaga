import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { resolveToCanonicalSlug } from "@/lib/hotel-parser";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "*, homestay:homestays(id, name, slug, city, price_per_night, homestay_images(url))",
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const hasFavorites = favorites && favorites.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-28 pb-20 max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Đã lưu</h1>
        <p className="text-gray-500 mb-8">
          Danh sách những chỗ ở bạn yêu thích.
        </p>

        {hasFavorites ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav: any) => {
              const canonical = resolveToCanonicalSlug(fav.homestay?.slug || String(fav.homestay?.id));
              const href = canonical ? `/homestays/${canonical}` : `/homestays?location=${encodeURIComponent(fav.homestay?.city || '')}`;
              return (
                <Link
                  href={href}
                  key={fav.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all"
                >
                <div className="relative aspect-4/3 overflow-hidden">
                  <SafeImage
                    src={
                      fav.homestay?.homestay_images?.[0]?.url ||
                      getLocationImage(
                        fav.homestay?.city || fav.homestay?.location,
                      )
                    }
                    alt={fav.homestay?.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900">
                    {fav.homestay?.name}
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {fav.homestay?.city}
                  </p>
                  <p className="mt-3">
                    <span className="text-lg font-black text-rose-600">
                      {Number(fav.homestay?.price_per_night).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                    <span className="text-gray-500 text-sm"> /đêm</span>
                  </p>
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Heart className="w-16 h-16 text-rose-100 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Chưa lưu chỗ ở nào
            </h2>
            <p className="text-gray-500 mb-6">
              Nhấn vào biểu tượng trái tim để lưu chỗ ở yêu thích.
            </p>
            <Link
              href="/homestays"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md inline-block"
            >
              Khám phá ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
