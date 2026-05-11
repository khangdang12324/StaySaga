"use client";

import { motion } from "framer-motion";
import { Heart, Star, MapPin } from "lucide-react";

const properties = [
  {
    id: 1,
    title: "Biệt thự biển ngắm hoàng hôn",
    location: "Nha Trang, Việt Nam",
    price: "2.500.000",
    rating: 4.9,
    reviews: 128,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Cabin gỗ giữa đồi thông",
    location: "Đà Lạt, Lâm Đồng",
    price: "1.200.000",
    rating: 4.8,
    reviews: 95,
    image:
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210a7?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Penthouse trung tâm thành phố",
    location: "Quận 1, TP. HCM",
    price: "3.800.000",
    rating: 5.0,
    reviews: 42,
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Eco Retreat Resort",
    location: "Sapa, Lào Cai",
    price: "1.800.000",
    rating: 4.7,
    reviews: 210,
    image:
      "https://images.unsplash.com/photo-1560067174-89451c3b89f2?q=80&w=2000&auto=format&fit=crop",
  },
];

export default function FeaturedHomestays() {
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
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden md:block px-6 py-3 border-2 border-gray-200 dark:border-zinc-800 rounded-full font-medium hover:border-rose-600 hover:text-rose-600 transition-colors"
          >
            Xem tất cả
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <button className="absolute top-4 right-4 p-2 bg-white/70 backdrop-blur-md rounded-full text-gray-600 hover:text-rose-600 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-rose-600 transition-colors">
                  {property.title}
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
                  {property.price}đ
                </span>
                <span className="text-gray-500 text-sm">/đêm</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
