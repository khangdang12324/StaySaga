"use client";

import { motion } from "framer-motion";
import { AdvancedSearchBar } from "@/components/features/search/AdvancedSearchBar";

export default function HeroSection() {
  return (
    <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2062"
          alt="Beautiful beach house"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-12 md:mt-16">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight"
        >
          Khám phá những điểm lưu trú <br className="hidden md:block" />
          <span className="text-rose-500 inline-block drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">
            tuyệt vời nhất
          </span>
        </motion.h1>

        {/* CÔNG CỤ TÌM KIẾM NÂNG CAO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="w-full relative z-30"
        >
          <AdvancedSearchBar />
        </motion.div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
    </div>
  );
}
