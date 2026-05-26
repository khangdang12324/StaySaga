import Link from "next/link";
import { Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-20 text-center">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[300px] w-[300px] sm:h-[450px] sm:w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-[80px] sm:blur-[120px]" />
      
      {/* 404 text with gradient */}
      <h1 className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-8xl font-black tracking-widest text-transparent sm:text-9xl">
        404
      </h1>
      
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-zinc-100">
        Không tìm thấy trang yêu cầu
      </h2>
      
      <p className="mt-4 max-w-md text-base text-gray-500 dark:text-zinc-400">
        Trang bạn đang tìm kiếm có thể đã bị xóa, thay đổi tên hoặc tạm thời không khả dụng.
      </p>

      {/* Action buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-semibold text-white transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20"
        >
          <Home className="h-5 w-5" />
          <span>Về Trang Chủ</span>
        </Link>
        <Link
          href="/help"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <HelpCircle className="h-5 w-5" />
          <span>Trung tâm trợ giúp</span>
        </Link>
      </div>

      {/* Suggested links */}
      <div className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Đường dẫn hữu ích
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/host" className="font-medium text-rose-600 hover:underline">
            Kênh chủ nhà (Extranet)
          </Link>
          <span className="text-gray-300 dark:text-zinc-700">•</span>
          <Link href="/destinations" className="font-medium text-rose-600 hover:underline">
            Khám phá điểm đến
          </Link>
          <span className="text-gray-300 dark:text-zinc-700">•</span>
          <Link href="/blog" className="font-medium text-rose-600 hover:underline">
            Cẩm nang du lịch
          </Link>
        </div>
      </div>
    </div>
  );
}
