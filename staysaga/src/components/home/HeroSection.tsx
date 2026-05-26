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
  subtitle = "Đặt phòng nhanh, rõ ràng và đẹp mắt theo phong cách hiện đại dành cho trải nghiệm Việt Nam.",
  heroImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2062&auto=format&fit=crop",
}: HeroSectionProps) {
  const displaySubtitle =
    subtitle?.includes("Booking") || subtitle?.includes("Agoda")
      ? "Đặt phòng nhanh, rõ ràng và đẹp mắt theo phong cách hiện đại dành cho trải nghiệm Việt Nam."
      : subtitle;

  return (
    <div
      className="relative z-20 flex min-h-[calc(100vh-88px)] items-center justify-center overflow-visible bg-gray-950 py-10 sm:py-12 lg:py-14"
    >
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <SafeImage
          src={heroImage}
          alt="Hotel room"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-[860px] text-4xl font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-[0_6px_22px_rgba(0,0,0,0.45)] sm:text-5xl md:text-6xl"
        >
          {title}
        </motion.h1>

        <p className="mt-5 max-w-3xl text-base leading-7 text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-lg">
          {displaySubtitle}
        </p>

        {/* CÔNG CỤ TÌM KIẾM NÂNG CAO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative z-30 mt-8 w-full"
        >
          <AdvancedSearchBar />
        </motion.div>
      </div>

    </div>
  );
}
