import { Calendar, MapPin, Search, Users } from "lucide-react";

export default function HeroSearch() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background image + overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070"
          alt="Homestay view"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/80" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[620px] max-w-6xl flex-col justify-end gap-6 px-4 pb-8 pt-24 sm:min-h-[680px] sm:justify-center sm:pb-12 md:px-8">
        {/* Title */}
        <div className="max-w-xl text-left text-white">
          <p className="font-['Manrope'] text-[11px] uppercase tracking-[0.3em] text-white/70">
            StaySaga
          </p>
          <h1 className="mt-3 font-['Clash_Display'] text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Khám phá những điểm lưu trú{" "}
            <span className="text-rose-300">tuyệt vời nhất</span>
          </h1>
          <p className="mt-3 font-['Manrope'] text-sm text-white/80 sm:text-base">
            Tìm ưu đãi độc quyền và trải nghiệm lưu trú đáng nhớ ở mọi điểm đến.
          </p>
        </div>

        {/* Search card */}
        <form className="w-full max-w-xl md:max-w-2xl">
          <div className="rounded-xl border border-rose-500/70 bg-white shadow-lg">
            <div className="divide-y divide-gray-200">
              <button
                type="button"
                aria-label="Chọn điểm đến"
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <MapPin className="h-5 w-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Địa điểm
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Tìm điểm đến...
                  </span>
                </div>
              </button>

              <button
                type="button"
                aria-label="Chọn ngày"
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <Calendar className="h-5 w-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Thời gian
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Check-in · Check-out
                  </span>
                </div>
              </button>

              <button
                type="button"
                aria-label="Chọn số khách"
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <Users className="h-5 w-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Khách hàng
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    2 người lớn · 0 trẻ em · 1 phòng
                  </span>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-200 px-4 pb-4 pt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500"
              >
                <Search className="h-5 w-5" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
