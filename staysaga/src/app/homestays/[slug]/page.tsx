import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  Wifi,
  FileText,
  Tag,
  Sparkles,
  Scale,
  Info,
  MessageSquare,
  Share2,
  Heart,
  ChevronDown,
  Globe,
  Ban,
  Music,
  Coffee,
  Languages,
} from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { getHotelBySlug, getAllHotels } from "@/lib/hotel-parser";
import { resolveHotelGallery } from "@/lib/hotel-images";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

const reviews = [
  { name: "Hương", text: "Mình đặt phòng gấp vì có việc lên Đà Lạt đột xuất. Không có nhiều lựa chọn nhưng may mắn chọn trúng chỗ này. Đôi khi quyết định vội lại cho kết quả tốt hơn cả khi cân nhắc kỹ", country: "Việt Nam" },
  { name: "Hà", text: "Mình với đứa bạn thân rủ nhau đi bụi cuối tuần, budget không nhiều. Chọn chỗ này vì giá ổn, không ngờ lại được nhiều hơn mong đợi. Bạn mình còn nói 'lần sau tụi mình phải quay lại đây' – nói lên tất cả rồi!", country: "Việt Nam" },
  { name: "Đức", text: "Đi công tác mà cảm giác như đi nghỉ dưỡng. Phòng dễ chịu, wifi ổn để làm việc, view đẹp để thư giãn. Ước gì chuyến công tác nào cũng được ở chỗ như vầy!", country: "Việt Nam" },
  { name: "Minh", text: "Cái ban công nhỏ nhìn ra vườn là điểm mình thích nhất. Sáng nào cũng ra đó ngồi uống cà phê, nhìn sương tan dần – cảm giác đó không mua được bằng tiền!", country: "Việt Nam" },
  { name: "Tình", text: "Mình tới check-in lúc sáng sớm, tưởng phải chờ tới chiều. Vậy mà nhân viên kiểm tra rồi nói phòng sẵn sàng rồi, cho vào luôn. Tiết kiệm được cả buổi sáng đi chơi – quý lắm!", country: "Việt Nam" },
];

const rooms = [
  { name: "Phòng Có Giường Cỡ Queen", size: "22 m²", price: "260.100", original: "722.499", savings: "64%", capacity: 2, left: 4 },
  { name: "Phòng Giường Đôi Hạng Tiết Kiệm", size: "18 m²", price: "279.650", original: "776.806", savings: "64%", capacity: 2 },
  { name: "Phòng Giường Đôi Hạng Bình Dân", size: "20 m²", price: "279.650", original: "776.806", savings: "64%", capacity: 2, left: 2 },
  { name: "Phòng Superior Có Giường Cỡ Queen", size: "25 m²", price: "306.000", original: "850.000", savings: "64%", capacity: 2, left: 1 },
];

export default async function HotelDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  const currency = cookieStore.get("currency")?.value || "VND";

  const formatPrice = (priceStr: string) => {
    const rawNum = parseInt(priceStr.replace(/\./g, ""));
    if (isNaN(rawNum)) return priceStr;
    if (currency === "USD") {
      return `USD ${(rawNum / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `VND ${rawNum.toLocaleString("vi-VN")}`;
  };

  const formatRelatedPrice = (priceFormatted: string) => {
    if (currency === "USD") {
      const numStr = priceFormatted.replace(/[^\d]/g, "");
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        return `USD ${(num / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    return priceFormatted;
  };
  const { slug } = await params;
  let hotel = getHotelBySlug(slug);

  // Fallback to ID lookup if slug doesn't match (for legacy or numeric IDs)
  if (!hotel && !isNaN(Number(slug))) {
    const { getHotelById } = await import("@/lib/hotel-parser");
    hotel = getHotelById(Number(slug));
  }

  if (!hotel) {
    return notFound();
  }

  const gallery = resolveHotelGallery(hotel);
  const relatedHotels = getAllHotels()
    .filter((item) => item.city === hotel.city && item.slug !== hotel.slug)
    .slice(0, 3);

  const heroImage = gallery[0] || hotel.imagePublicPath;
  const secondaryImages = gallery.slice(1, 10);
  const defaultCheckIn = new Date();
  const defaultCheckOut = new Date(defaultCheckIn);
  defaultCheckOut.setDate(defaultCheckIn.getDate() + 1);
  const defaultCheckInParam = defaultCheckIn.toISOString().split("T")[0];
  const defaultCheckOutParam = defaultCheckOut.toISOString().split("T")[0];

  const tabs = [
    { label: "Tổng quan", icon: FileText, href: "#overview", active: true },
    { label: "Thông tin & giá", icon: Tag, href: "#booking" },
    { label: "Tiện nghi", icon: Sparkles, href: "#amenities" },
    { label: "Quy tắc chung", icon: Scale, href: "#rules" },
    { label: "Đánh giá của khách", icon: MessageSquare, href: "#reviews", count: hotel.reviews_count || 66 },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-sky-600">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <Link href="/destinations" className="hover:underline">Vietnam</Link>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <Link href={`/destinations?city=${encodeURIComponent(hotel.city)}`} className="hover:underline">
            {hotel.city}
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-400" />
          <span className="text-zinc-500">Ưu đãi cho {hotel.title}</span>
        </nav>

        {/* Tabs Bar */}
        <div className="mb-6 flex items-center border-b border-zinc-200 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                tab.active 
                  ? "border-rose-600 text-rose-600" 
                  : "border-transparent text-zinc-600 hover:text-rose-600"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && <span className="ml-1">({tab.count})</span>}
            </Link>
          ))}
        </div>

        {/* Header Info */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex">
                {[1, 2].map((i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 md:text-3xl">{hotel.title}</h1>
            <div className="mt-2 flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 text-rose-600" />
              <span className="text-zinc-700">{hotel.city}, Việt Nam — </span>
              <button className="font-bold text-rose-600 hover:underline">Vị trí xuất sắc - hiển thị bản đồ</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
               <button className="text-[13px] font-bold text-rose-600 hover:underline">Chúng Tôi Luôn Khớp Giá!</button>
            </div>
            <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
              <Heart className="h-5 w-5" />
            </button>
            <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <Link 
              href={`/checkout/${hotel.id}`}
              className="rounded bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition-colors"
            >
              Đặt ngay
            </Link>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-1.5 overflow-hidden rounded-lg">
            {/* Main Big Image */}
            <div className="col-span-4 lg:col-span-2 row-span-2 relative aspect-[4/3] lg:aspect-auto h-full min-h-[400px]">
              <SafeImage src={heroImage} alt={hotel.title} fill className="object-cover cursor-pointer hover:opacity-95 transition-opacity" />
            </div>
            
            {/* Grid Images */}
            <div className="hidden lg:grid col-span-2 grid-cols-2 grid-rows-2 gap-1.5">
              {secondaryImages.slice(0, 4).map((img, i) => (
                <div key={i} className="relative aspect-square">
                  <SafeImage src={img} alt={`${hotel.title} ${i+1}`} fill className="object-cover cursor-pointer hover:opacity-95 transition-opacity" />
                  {i === 3 && secondaryImages.length > 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold cursor-pointer">
                      +{secondaryImages.length - 3} ảnh
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2.2fr_0.8fr]">
          <div className="space-y-12">
            {/* Description */}
            <section id="overview" className="border-b border-zinc-100 pb-8">
               <p className="text-sm leading-7 text-zinc-700 whitespace-pre-line">
                 Tọa lạc ở {hotel.city}, cách Quảng trường Lâm Viên 2.5 km và Hồ Xuân Hương 2.7 km, {hotel.title} cung cấp chỗ nghỉ có quầy bar và Wi-Fi miễn phí ở toàn bộ chỗ nghỉ cũng như chỗ đậu xe riêng miễn phí cho khách lái xe. Khách sạn 2 sao này có quầy lễ tân 24 giờ. Đây là chỗ nghỉ không hút thuốc và nằm cách Công viên Yersin 2.8 km.
                 {"\n\n"}
                 Khách sạn có trung tâm spa.
                 {"\n\n"}
                 {hotel.title} cách Sân golf Dalat Palace Golf Club 2.9 km và Vườn hoa Đà Lạt 3.7 km.
                 {"\n\n"}
                 Các cặp đôi đặc biệt thích địa điểm này — họ cho điểm 8,0 khi đánh giá chuyến đi hai người.
               </p>
               <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
                  <Globe className="h-4 w-4" />
                  <span>Các khoảng cách nêu trong mô tả chỗ nghỉ được tính toán bằng © OpenStreetMap</span>
               </div>
            </section>

            {/* Top Amenities List */}
            <section className="border-b border-zinc-100 pb-8">
              <h2 className="mb-4 text-xl font-bold text-zinc-900">Các tiện nghi được ưa chuộng nhất</h2>
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                 {[
                   { icon: Wifi, label: "WiFi miễn phí" },
                   { icon: Ban, label: "Phòng không hút thuốc" },
                   { icon: Sparkles, label: "Trung tâm Spa & chăm sóc sức khoẻ" },
                   { icon: BedDouble, label: "Phòng gia đình" },
                   { icon: CarFront, label: "Chỗ đỗ xe miễn phí" },
                   { icon: Clock3, label: "Lễ tân 24 giờ" },
                   { icon: Coffee, label: "Quầy bar" },
                 ].map((item) => (
                   <div key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-green-700">
                     <item.icon className="h-5 w-5 text-green-600" />
                     {item.label}
                   </div>
                 ))}
              </div>
            </section>

            {/* Room Availability */}
            <section id="booking" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900">Phòng trống</h2>
                <div className="flex items-center gap-4 text-sm font-bold text-rose-600">
                   <span>Chúng Tôi Luôn Khớp Giá!</span>
                </div>
              </div>
              
              <div className="overflow-hidden rounded-lg border border-zinc-200">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-rose-600 text-white">
                     <tr>
                       <th className="px-4 py-4 font-semibold w-1/3">Loại chỗ nghỉ</th>
                       <th className="px-4 py-4 font-semibold">Số lượng khách</th>
                       <th className="px-4 py-4 font-semibold">Giá hôm nay</th>
                       <th className="px-4 py-4 font-semibold">Các lựa chọn</th>
                       <th className="px-4 py-4 font-semibold">Chọn phòng</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-200">
                     {rooms.map((room) => (
                       <tr key={room.name} className="hover:bg-zinc-50 transition-colors">
                         <td className="px-4 py-6 align-top">
                           <button className="font-bold text-rose-600 hover:underline text-[15px]">{room.name}</button>
                           <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                              <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> 1 giường đôi lớn</span>
                              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {room.size}</span>
                              <span className="flex items-center gap-1 font-medium text-zinc-700">Phòng tắm riêng</span>
                              <span className="flex items-center gap-1 font-medium text-zinc-700">WiFi miễn phí</span>
                           </div>
                         </td>
                         <td className="px-4 py-6 align-top">
                           <div className="flex gap-0.5"><BedDouble className="h-4 w-4" /></div>
                         </td>
                         <td className="px-4 py-6 align-top">
                           <div className="text-[11px] text-rose-500 line-through">{formatPrice(room.original)}</div>
                           <div className="text-xl font-bold text-zinc-900">{formatPrice(room.price)}</div>
                           <div className="text-[10px] text-zinc-500">Đã bao gồm thuế và phí</div>
                           <div className="mt-1 inline-block rounded bg-green-600 px-1 py-0.5 text-[10px] font-bold text-white uppercase">Tiết kiệm {room.savings}</div>
                         </td>
                         <td className="px-4 py-6 align-top space-y-3">
                           <div className="text-[13px] font-medium text-zinc-700">Phí hủy: Toàn bộ tiền phòng</div>
                           <div className="text-[13px] font-bold text-green-700">Không cần thanh toán trước - thanh toán tại chỗ nghỉ</div>
                           <div className="text-[13px] font-medium text-green-700">Không cần thẻ tín dụng</div>
                           {room.left && (
                              <div className="text-[11px] font-bold text-rose-600">• Chúng tôi còn {room.left} căn</div>
                           )}
                         </td>
                         <td className="px-4 py-6 align-top">
                            <div className="flex flex-col gap-4">
                              <select className="w-full rounded border border-zinc-300 p-1.5 focus:ring-1 focus:ring-rose-500">
                                <option>0</option>
                                <option>1</option>
                                <option>2</option>
                              </select>
                              <Link 
                                href={`/checkout/${hotel.slug || hotel.id}?checkIn=${defaultCheckInParam}&checkOut=${defaultCheckOutParam}&guests=2`}
                                className="w-full text-center rounded bg-rose-600 px-4 py-3 text-[15px] font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
                              >
                                Tôi sẽ đặt
                              </Link>
                              <div className="text-[10px] text-zinc-500 text-center">Chỉ mất 2 phút. Không cần thẻ tín dụng.</div>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </section>

            {/* Guest Reviews Section */}
            <section id="reviews" className="space-y-6 pt-12 border-t border-zinc-100">
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">Đánh giá của khách</h2>
                  <button className="rounded border border-rose-600 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors">Đọc tất cả đánh giá</button>
               </div>
               
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((review, i) => (
                    <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
                             {review.name[0]}
                          </div>
                          <div>
                             <div className="font-bold text-zinc-900">{review.name}</div>
                             <div className="flex items-center gap-1 text-xs text-zinc-500">
                                <span className="h-2 w-3 bg-red-600 rounded-sm" /> {review.country}
                             </div>
                          </div>
                       </div>
                       <p className="text-[13px] leading-6 text-zinc-700 italic line-clamp-4">&ldquo;{review.text}&rdquo;</p>
                       <button className="mt-4 text-[11px] font-bold text-rose-600 hover:underline">Tìm hiểu thêm</button>
                    </div>
                  ))}
               </div>
            </section>

            {/* Categorized Amenities */}
            <section id="amenities" className="pt-12 border-t border-zinc-100">
               <h2 className="mb-8 text-2xl font-bold text-zinc-900">Các tiện nghi của {hotel.title}</h2>
               <div className="grid gap-8 sm:grid-cols-2">
                  <div className="space-y-6">
                     <div>
                        <h4 className="flex items-center gap-2 font-bold text-zinc-900 mb-3"><CarFront className="h-5 w-5" /> Chỗ đậu xe</h4>
                        <p className="text-sm text-zinc-600">Có chỗ đỗ xe riêng miễn phí tại chỗ (không cần đặt chỗ trước).</p>
                     </div>
                     <div>
                        <h4 className="flex items-center gap-2 font-bold text-zinc-900 mb-3"><Wifi className="h-5 w-5" /> Internet</h4>
                        <p className="text-sm text-zinc-600">Wi-fi có ở toàn bộ khách sạn và miễn phí.</p>
                     </div>
                     <div>
                        <h4 className="flex items-center gap-2 font-bold text-zinc-900 mb-3"><Clock3 className="h-5 w-5" /> Dịch vụ</h4>
                        <p className="text-sm text-zinc-600">Lễ tân 24 giờ, Dịch vụ phòng, Trung tâm Spa & chăm sóc sức khoẻ.</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div>
                        <h4 className="flex items-center gap-2 font-bold text-zinc-900 mb-3"><Ban className="h-5 w-5" /> Tổng quát</h4>
                        <p className="text-sm text-zinc-600">Cấm hút thuốc trong toàn bộ khuôn viên, Phòng gia đình, Phòng không hút thuốc.</p>
                     </div>
                     <div>
                        <h4 className="flex items-center gap-2 font-bold text-zinc-900 mb-3"><Languages className="h-5 w-5" /> Ngôn ngữ được sử dụng</h4>
                        <p className="text-sm text-zinc-600">Tiếng Anh, Tiếng Việt.</p>
                     </div>
                  </div>
               </div>
            </section>

            {/* House Rules */}
            <section id="rules" className="pt-12 border-t border-zinc-100">
               <h2 className="mb-6 text-2xl font-bold text-zinc-900">Quy tắc chung</h2>
               <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="grid sm:grid-cols-[1fr_3fr] border-b border-zinc-200">
                     <div className="bg-zinc-50 p-4 font-bold text-sm">Nhận phòng</div>
                     <div className="p-4 text-sm text-zinc-700">Từ 14:00 - 00:00</div>
                  </div>
                  <div className="grid sm:grid-cols-[1fr_3fr] border-b border-zinc-200">
                     <div className="bg-zinc-50 p-4 font-bold text-sm">Trả phòng</div>
                     <div className="p-4 text-sm text-zinc-700">Từ 12:00 - 00:00</div>
                  </div>
                  <div className="grid sm:grid-cols-[1fr_3fr] border-b border-zinc-200">
                     <div className="bg-zinc-50 p-4 font-bold text-sm">Chính sách trẻ em</div>
                     <div className="p-4 text-sm text-zinc-700">Phù hợp cho tất cả trẻ em. Chỗ nghỉ này không có nôi/cũi và giường phụ.</div>
                  </div>
                  <div className="grid sm:grid-cols-[1fr_3fr] border-b border-zinc-200">
                     <div className="bg-zinc-50 p-4 font-bold text-sm">Vật nuôi</div>
                     <div className="p-4 text-sm text-zinc-700">Vật nuôi được phép theo yêu cầu của khách. Có thể bị tính phí.</div>
                  </div>
                  <div className="grid sm:grid-cols-[1fr_3fr]">
                     <div className="bg-zinc-50 p-4 font-bold text-sm">Tiệc tùng</div>
                     <div className="p-4 text-sm text-zinc-700">Không cho phép tiệc tùng/sự kiện.</div>
                  </div>
               </div>
            </section>

            {/* FAQs */}
            <section className="pt-12 border-t border-zinc-100">
               <h2 className="mb-6 text-2xl font-bold text-zinc-900">Những câu hỏi thường gặp về {hotel.title}</h2>
               <div className="space-y-4">
                  {[
                    "Chỗ nghỉ này có những loại phòng nào?",
                    "Giờ nhận và trả phòng như thế nào?",
                    "Chi phí nghỉ tại đây là bao nhiêu?",
                    "Tôi có thể làm gì ở đây?",
                    "Chỗ nghỉ cách trung tâm Đà Lạt bao xa?",
                  ].map((q) => (
                    <div key={q} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer group transition-colors">
                       <span className="text-sm font-bold text-zinc-800 group-hover:text-rose-600">{q}</span>
                       <ChevronDown className="h-5 w-5 text-zinc-400 group-hover:text-rose-600 transition-colors" />
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Rating Box */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900">Tuyệt hảo</h3>
                  <p className="text-[13px] text-zinc-500">{hotel.reviews_count || 66} đánh giá</p>
                </div>
                <div className="flex items-center justify-center rounded-xl bg-rose-600 h-12 w-12 text-xl font-bold text-white shadow-rose-200 shadow-lg">
                  {hotel.displayRating ? hotel.displayRating.toFixed(1) : "9.3"}
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-100 pt-4">
                 <p className="text-[13px] text-zinc-600 font-medium">Nhân viên phục vụ: <span className="float-right font-bold text-zinc-900">9.4</span></p>
                 <div className="mt-2 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-600 w-[94%]" />
                 </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm cursor-pointer h-48">
               <iframe
                  title={`${hotel.title} map`}
                  loading="lazy"
                  className="h-full w-full border-0 grayscale group-hover:grayscale-0 transition-all duration-700"
                  src={`https://www.google.com/maps?q=${hotel.mapQuery}&output=embed`}
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                   <div className="rounded-full bg-rose-600 px-6 py-2.5 text-[13px] font-bold text-white shadow-xl group-hover:scale-105 transition-transform">
                     Hiển thị trên bản đồ
                   </div>
                </div>
            </div>
            
            {/* Highlights Sidebar */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
               <h4 className="font-bold text-zinc-900">Điểm nổi bật của chỗ nghỉ</h4>
               <ul className="space-y-3">
                  {[
                    { icon: MapPin, text: "Vị trí xuất sắc: 9.4/10" },
                    { icon: BedDouble, text: "Giường ngủ cực kỳ thoải mái" },
                    { icon: CarFront, text: "Đậu xe miễn phí ngay tại chỗ" },
                    { icon: Heart, text: "Cực kỳ thích hợp cho các cặp đôi" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[13px] text-zinc-600">
                       <item.icon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                       {item.text}
                    </li>
                  ))}
               </ul>
            </div>

            {/* CTA Sidebar */}
            <div className="rounded-xl bg-zinc-900 p-6 text-white space-y-4">
               <p className="text-sm font-bold text-rose-400 uppercase tracking-widest">StaySaga Exclusive</p>
               <h4 className="text-xl font-bold">Bạn vẫn đang tìm kiếm?</h4>
               <p className="text-sm text-zinc-400">Đặt câu hỏi cho chúng tôi, chúng tôi có thể giải đáp tức thì!</p>
               <button className="w-full rounded-xl bg-rose-600 py-3 font-bold hover:bg-rose-700 transition-colors">Đặt câu hỏi</button>
            </div>
          </aside>
        </div>

        {/* Similar Hotels */}
        {relatedHotels.length > 0 && (
          <section className="mt-20 border-t border-zinc-200 pt-16">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-3xl font-extrabold text-zinc-900">Những chỗ nghỉ tương tự ở {hotel.city}</h2>
               <Link href="/homestays" className="text-rose-600 font-bold hover:underline">Xem thêm →</Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {relatedHotels.map((item) => (
                <Link
                  key={item.id}
                  href={`/homestays/${item.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <SafeImage src={item.imagePublicPath} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 group-hover:text-rose-600 transition-colors line-clamp-1">{item.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-[13px] text-zinc-500 font-medium">
                     <MapPin className="h-3.5 w-3.5" /> {item.city}
                  </div>
                  <div className="mt-2 text-lg font-black text-rose-600">{formatRelatedPrice(item.priceFormatted)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
