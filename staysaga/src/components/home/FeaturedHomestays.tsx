import { motion } from "framer-motion";
import { Heart, Star, MapPin, Home } from "lucide-react";
import Link from "next/link";
import { resolveToCanonicalSlug } from "@/lib/hotel-parser";
import SafeImage from "@/components/ui/SafeImage";
import { getProperties } from "@/core/properties/actions";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles";
import { getLocationImage } from "@/lib/images/location-images";

type FeaturedProperty = {
  id: string;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  location?: string | null;
  image?: string | null;
  rating?: number | null;
  price?: number | null;
};

/** Không dùng ảnh Unsplash ngẫu nhiên để tránh “lạc nơi”.
 *  Featured sẽ lấy ảnh theo location đã verify.
 */

export default async function FeaturedHomestays() {
  const { properties } = await getProperties({ page: 1 });

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let hostHref = "/login?next=/host";
  if (session?.user) {
    const role = await getUserRole(supabase, session.user.id);
    hostHref =
      role === "host" || role === "admin" ? "/host" : "/login?next=/host";
  }

  const list = await Promise.all(
    ((properties || []).slice(0, 4) as FeaturedProperty[]).map(
      async (property, index) => ({
        ...property,
        image: getLocationImage(
          property.location || property.title || property.name,
          index,
        ),
      }),
    ),
  );

  return (
    <section className="py-20 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Chỗ ở nổi bật
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-lg">
              Khám phá những không gian lưu trú được yêu thích nhất, mang đến
              trải nghiệm tuyệt vời cho kỳ nghỉ của bạn.
            </p>
          </motion.div>
          <motion.a
            href={hostHref}
            className="hidden md:inline-flex items-center gap-2 rounded-full px-5 font-medium transition hover:bg-gray-100 bg-gray-50/60 border border-gray-200 text-gray-700 py-2"
          >
            <Home className="w-4 h-4 mr-1" />
            Đăng chỗ nghỉ
          </motion.a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {list.map((property, index) => {
            const canonical = resolveToCanonicalSlug(property.slug || property.id);
            const href = canonical
              ? `/homestays/${canonical}`
              : `/homestays?location=${encodeURIComponent(
                  property.location || property.title || "",
                )}`;

            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Link href={href} className="block cursor-pointer">
                  <div className="relative aspect-4/3 overflow-hidden rounded-2xl mb-4">
                    <SafeImage
                      src={property.image}
                      alt={property.title || property.name || "Ảnh chỗ ở"}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <button className="absolute top-4 right-4 p-2 bg-white/70 backdrop-blur-md rounded-full text-gray-600 hover:text-rose-600 transition-colors z-10">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-600 transition-colors">
                      {property.title || property.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{property.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="truncate">{property.location}</span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {Number(property.price).toLocaleString()}đ
                    </span>
                    <span className="text-gray-500 text-sm">/đêm</span>
                  </div>
                </Link>

                <div className="mt-3 flex items-center justify-between">
                  <a
                    href={hostHref}
                    className="text-sm font-medium text-rose-600 hover:underline"
                  >
                    Quản lý chỗ ở
                  </a>
                  <Link href={href} className="text-sm text-gray-600 hover:text-rose-600">
                    Xem chi tiết →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
