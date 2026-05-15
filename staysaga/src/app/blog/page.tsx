import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";

const posts = [
  {
    id: "1",
    title: "Cẩm nang du lịch Nha Trang tự túc 3 ngày 2 đêm",
    category: "Cẩm nang",
    date: "20 Tháng 5, 2026",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1000",
  },
  {
    id: "2",
    title: "Top 5 quán cà phê ngắm mây tuyệt đẹp ở Sapa",
    category: "Ẩm thực",
    date: "15 Tháng 5, 2026",
    image:
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210a7?q=80&w=1000",
  },
  {
    id: "3",
    title: "Kinh nghiệm săn homestay view đẹp tại Đà Lạt",
    category: "Kinh nghiệm",
    date: "10 Tháng 5, 2026",
    image:
      "https://images.unsplash.com/photo-1560067174-89451c3b89f2?q=80&w=1000",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Trải nghiệm & Cẩm nang
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Những câu chuyện du lịch truyền cảm hứng, kinh nghiệm thiết thực và
            bí kíp cho chuyến đi hoàn hảo của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
            >
              <Link href={`#`}>
                <div className="aspect-video overflow-hidden">
                  <SafeImage
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-3">
                    <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-rose-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 line-clamp-3">
                    Bài viết chia sẻ những kinh nghiệm thực tế nhất giúp bạn có
                    một chuyến đi trọn vẹn, tiết kiệm và đáng nhớ...
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
