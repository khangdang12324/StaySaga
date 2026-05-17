import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getLocationImage } from "@/lib/images/location-images";

const destinations = [
  {
    id: "1",
    name: "Nha Trang",
    count: 124,
    image: getLocationImage("Nha Trang"),
  },
  {
    id: "2",
    name: "Đà Lạt",
    count: 356,
    image: getLocationImage("Đà Lạt"),
  },
  {
    id: "3",
    name: "TP. Hồ Chí Minh",
    count: 890,
    image: getLocationImage("TP. Hồ Chí Minh"),
  },
  {
    id: "4",
    name: "Hội An",
    count: 210,
    image: getLocationImage("Hội An"),
  },
  {
    id: "5",
    name: "Sapa",
    count: 145,
    image: getLocationImage("Sapa"),
  },
  {
    id: "6",
    name: "Phú Quốc",
    count: 432,
    image: getLocationImage("Phú Quốc"),
  },
  {
    id: "7",
    name: "Huế",
    count: 168,
    image: getLocationImage("Huế"),
  },
  {
    id: "8",
    name: "Cần Thơ",
    count: 152,
    image: getLocationImage("Cần Thơ"),
  },
  {
    id: "9",
    name: "Hạ Long",
    count: 238,
    image: getLocationImage("Hạ Long"),
  },
  {
    id: "10",
    name: "Ninh Bình",
    count: 118,
    image: getLocationImage("Ninh Bình"),
  },
  {
    id: "11",
    name: "Vũng Tàu",
    count: 205,
    image: getLocationImage("Vũng Tàu"),
  },
  {
    id: "12",
    name: "Quy Nhơn",
    count: 96,
    image: getLocationImage("Quy Nhơn"),
  },
  {
    id: "13",
    name: "Mũi Né",
    count: 84,
    image: getLocationImage("Mũi Né"),
  },
  {
    id: "14",
    name: "Hà Giang",
    count: 73,
    image: getLocationImage("Hà Giang"),
  },
  {
    id: "15",
    name: "Cao Bằng",
    count: 61,
    image: getLocationImage("Cao Bằng"),
  },
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          Điểm đến được yêu thích
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-3xl">
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
              <SafeImage
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
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
