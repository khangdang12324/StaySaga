import Link from "next/link";

const destinations = [
  {
    id: "1",
    name: "Nha Trang",
    count: 124,
    image:
      "https://images.unsplash.com/photo-1560067174-89451c3b89f2?q=80&w=1000",
  },
  {
    id: "2",
    name: "Đà Lạt",
    count: 356,
    image:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000",
  },
  {
    id: "3",
    name: "TP. Hồ Chí Minh",
    count: 890,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1000",
  },
  {
    id: "4",
    name: "Hội An",
    count: 210,
    image:
      "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?q=80&w=1000",
  },
  {
    id: "5",
    name: "Sapa",
    count: 145,
    image:
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210a7?q=80&w=1000",
  },
  {
    id: "6",
    name: "Phú Quốc",
    count: 432,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000",
  },
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
          Điểm đến được yêu thích
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl">
          Khám phá những thành phố, hòn đảo và vùng đất tuyệt đẹp nhất Việt Nam
          thông qua các chỗ ở độc đáo trên StaySaga.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((dest) => (
            <Link
              href={`/homestays?location=${encodeURIComponent(dest.name)}`}
              key={dest.id}
              className="group relative h-80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {dest.name}
                </h2>
                <p className="text-white/80 font-medium">{dest.count} chỗ ở</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
