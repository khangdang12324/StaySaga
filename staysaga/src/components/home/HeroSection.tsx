"use client";

import { motion } from "framer-motion";
import { AdvancedSearchBar } from "@/components/features/search/AdvancedSearchBar";
import SafeImage from "@/components/ui/SafeImage";

type HeroSectionProps = {
  title?: string;
  subtitle?: string;
  heroImage?: string;
};

export default function HeroSection({
  title = "Khám phá những điểm lưu trú tuyệt vời nhất",
  subtitle = "Đặt phòng nhanh, rõ ràng và đẹp mắt theo phong cách Booking/Agoda, nhưng tối ưu cho trải nghiệm Việt Nam.",
  heroImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2062&auto=format&fit=crop",
}: HeroSectionProps) {
  return (
    <div
      className="relative h-screen flex items-center justify-center bg-white"
      style={{ minHeight: 600 }}
    >
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <SafeImage
          src={heroImage}
          alt="Hotel room"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-white/45 via-white/20 to-white/80" />
        <div className="absolute inset-0 bg-linear-to-t from-rose-50/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-12 md:mt-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black text-gray-950 mb-4 md:mb-6 tracking-tight leading-tight drop-shadow-[0_6px_24px_rgba(15,23,42,0.08)]"
        >
          {title}
        </motion.h1>

        <p className="max-w-3xl text-sm sm:text-base md:text-lg text-gray-700 mb-6 md:mb-8">
          {subtitle}
        </p>

        {/* CÔNG CỤ TÌM KIẾM NÂNG CAO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="w-full relative z-30 mt-2"
        >
          <AdvancedSearchBar />
        </motion.div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-white to-transparent z-10 pointer-events-none" />
    </div>
  );
}
