"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Bell,
  HelpCircle,
  Globe,
} from "lucide-react";
import { saveAmenitiesAction } from "./actions";

type AmenitiesFormProps = {
  propertyId: string;
  propertyName: string;
  initialAreaSqm: number;
  savedAmenityNames: string[];
};

// Define all amenity groups matching the user requests
const topAmenities = [
  "Điều hòa không khí",
  "Bếp nhỏ",
  "Bếp",
  "Ban công",
  "Tầm nhìn ra khung cảnh",
  "TV màn hình phẳng",
  "Hồ bơi riêng",
  "Sân hiên",
  "Máy giặt",
];

const roomAmenities = [
  "Cũi trẻ em",
  "Giá treo quần áo",
  "Giá phơi quần áo",
  "Giường xếp",
  "Giường sofa",
  "Thùng rác",
  "Hồ bơi nước nóng",
  "Hồ bơi vô cực",
  "Bể ngâm",
  "Mái che hồ bơi",
  "Quầy bar hồ bơi",
  "Hồ bơi có tầm nhìn",
  "Hồ bơi trên sân thượng",
  "Hồ bơi nước mặn",
  "Chỗ cạn",
  "Máy sấy quần áo",
  "Tủ hoặc phòng để quần áo",
  "Sàn trải thảm",
  "Phòng thay quần áo",
  "Giường cực dài (> 2 mét)",
  "Quạt máy",
  "Lò sưởi",
  "Hệ thống sưởi",
  "Có phòng thông nhau qua cửa nối",
  "Bàn ủi",
  "Tiện nghi ủi",
  "Bể sục",
  "Màn chống muỗi",
  "Lối vào riêng",
  "Két an toàn",
  "Ghế sofa",
  "Hệ thống cách âm",
  "Khu vực tiếp khách",
  "Sàn lát gạch/đá cẩm thạch",
  "Bàn ủi li quần",
  "Sàn lát gỗ",
  "Bàn làm việc",
  "Không gây dị ứng",
  "Sản phẩm lau rửa",
  "Chăn điện",
  "Pajama",
  "Áo choàng tắm",
  "Ổ điện gần giường",
  "Thiết bị chuyển nguồn",
  "Gối lông vũ",
  "Gối thường",
  "Gối chống dị ứng",
];

const bathroomAmenities = [
  "Giấy vệ sinh",
  "Bồn tắm",
  "Chậu rửa vệ sinh (bidet)",
  "Bồn tắm hoặc vòi sen",
  "Áo choàng tắm",
  "Đồ vệ sinh cá nhân miễn phí",
  "Toilet phụ",
  "Máy sấy tóc",
  "Bồn tắm spa",
  "Toilet chung",
  "Phòng xông hơi",
  "Vòi sen",
  "Dép",
  "Nhà vệ sinh",
  "Bàn chải",
  "Dầu gội đầu",
  "Dầu xả",
  "Xà phòng tắm",
  "Mũ tắm",
];

const mediaAmenities = [
  "Thiết bị chơi game - PS4",
  "Thiết bị chơi game - Wii U",
  "Thiết bị chơi game - Xbox One",
  "Máy vi tính",
  "Thiết bị chơi game",
  "Thiết bị chơi game - Nintendo Wii",
  "Thiết bị chơi game - PS2",
  "Thiết bị chơi game - PS3",
  "Thiết bị chơi game - Xbox 360",
  "Máy tính xách tay",
  "iPad",
  "Truyền hình cáp",
  "Đầu đĩa CD",
  "Đầu đĩa DVD",
  "Máy fax",
  "Ổ cắm cho iPod",
  "Két an toàn cỡ laptop",
  "Truyền hình trả tiền",
  "Đài radio",
  "Truyền hình vệ tinh",
  "Điện thoại",
  "TV",
  "Đầu video",
  "Trò chơi điện tử",
  "Đầu đĩa Blu-ray",
  "Thiết bị hotspot di động",
  "Điện thoại thông minh",
  "Dịch vụ streaming (như là Netflix)",
];

const foodAmenities = [
  "Khu vực phòng ăn",
  "Bàn ăn",
  "Ly rượu",
  "Chai nước",
  "Sô-cô-la hoặc bánh quy",
  "Trái cây",
  "Rượu vang hoặc sâm panh",
  "Tiện nghi BBQ",
  "Lò nướng",
  "Bếp nấu",
  "Máy nướng bánh mỳ",
  "Máy rửa bát",
  "Ấm đun nước điện",
  "Khu vực ăn uống ngoài trời",
  "Bàn ghế ngoài trời",
  "Minibar",
  "Đồ bếp",
  "Lò vi sóng",
  "Tủ lạnh",
  "Máy pha trà/cà phê",
  "Máy pha cà phê",
  "Ghế cao dành cho trẻ em",
];

const serviceAmenities = [
  "Ổ khóa mở bằng thẻ",
  "Tủ khóa",
  "Ổ khóa",
  "Quyền sử dụng Executive Lounge",
  "Đồng hồ báo thức",
  "Dịch vụ báo thức",
  "Ra trải giường",
  "Khăn tắm",
  "Khăn tắm/Bộ khăn trải giường (có thu phí)",
];

const outdoorAmenities = [
  "Sân trong",
  "Nhìn ra thành phố",
  "Nhìn ra vườn",
  "Nhìn ra hồ",
  "Nhìn ra địa danh nổi tiếng",
  "Nhìn ra núi",
  "Nhìn ra hồ bơi",
  "Nhìn ra sông",
  "Nhìn ra biển",
  "Hướng nhìn sân trong",
  "Hướng nhìn ra đường phố yên ắng",
];

const disabledAmenities = [
  "Lối vào dành cho người khuyết tật",
  "Có thang máy",
  "Hoàn toàn nằm ở tầng trệt",
  "Xe lăn có thể đi đến mọi nơi trong toàn bộ khuôn viên",
  "Tiện ích hỗ trợ người khiếm thính",
  "Các tầng trên đi lên bằng thang máy",
  "Các tầng trên chỉ lên được bằng cầu thang",
  "Bồn tắm tiếp cận người khuyết tật",
  "Dây khẩn cấp trong phòng tắm",
  "Toilet cao",
  "Bồn rửa mặt thấp hơn",
  "Phòng tắm tiếp cận người khuyết tận",
  "Ghế tắm",
  "Toilet dành cho người khuyết tật",
  "Phòng tắm đứng",
];

const buildingAmenities = [
  "Đơn lập",
  "Căn hộ riêng trong tòa nhà",
  "Song lập",
];

const familyAmenities = [
  "Cửa an toàn cho trẻ nhỏ",
  "Trò chơi board game/giải đố",
  "Sách, đĩa DVD và nhạc cho trẻ em",
  "Nắp che ổ cắm điện an toàn",
];

const securityAmenities = [
  "Thiết bị báo carbon monoxide",
  "Các nguồn carbon monoxide",
  "Thiết bị báo cháy",
  "Bình chữa cháy",
  "Các tiện ích an toàn",
  "Máy lọc không khí",
  "Giãn cách xã hội",
  "Máy điều hòa độc lập cho từng phòng",
];

const cleaningAmenities = [
  "Nước rửa tay",
];

// Items that require a "Mới!" badge
const newItems = new Set([
  "Ổ khóa mở bằng thẻ",
  "Tủ khóa",
  "Ổ khóa",
  "Thiết bị báo cháy",
  "Bình chữa cháy",
]);

export function AmenitiesForm({
  propertyId,
  propertyName,
  initialAreaSqm,
  savedAmenityNames,
}: AmenitiesFormProps) {
  const [area, setArea] = useState<string>(String(initialAreaSqm));
  const [unit, setUnit] = useState<"sqm" | "sqft">("sqm");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  // Keep track of check state in a local Map/State for easy styling of buttons
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    savedAmenityNames.forEach((name) => {
      initial[name] = true;
    });
    return initial;
  });

  const handleToggleAmenity = (name: string, isChecked: boolean) => {
    setSelectedAmenities((prev) => ({
      ...prev,
      [name]: isChecked,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const activeList = Object.entries(selectedAmenities)
      .filter(([_, value]) => value === true)
      .map(([name]) => name);

    const parsedArea = Number(area) || 0;

    const res = await saveAmenitiesAction(propertyId, parsedArea, activeList);
    setIsSubmitting(false);

    if (res.success) {
      setStatus({ type: "success", message: "Đã lưu tiện nghi phòng." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStatus({ type: "error", message: `Lỗi: ${res.error || "Không thể lưu."}` });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Check area size warning
  const numArea = Number(area) || 0;
  const isAreaEmptyOrZero = area.trim() === "" || numArea <= 0;
  const isAreaTooSmall = numArea > 0 && numArea < 6;

  // Short ID representation matching the screenshot style
  const shortId = propertyId.slice(0, 8);

  return (
    <form onSubmit={handleSave} className="min-h-screen bg-[#f5f5f5] pb-32 text-[#1a1a1a] font-sans">
      {/* Top Header */}
      <header className="bg-[#003b95] text-white">
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/host" className="text-[22px] font-bold tracking-tight text-white hover:opacity-90">
              StaySaga
            </Link>
            <div className="hidden h-6 w-px bg-white/20 md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <span className="font-semibold text-sm truncate max-w-[180px]">{propertyName || "Khang home"}</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/80 font-medium">
                {shortId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative hidden w-[320px] lg:block">
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="h-9 w-full rounded border-0 bg-white pl-3 pr-10 text-sm text-[#1a1a1a] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>

            <button type="button" className="flex items-center gap-1.5 hover:bg-white/10 p-1.5 rounded transition">
              <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold text-white border border-white">
                ★
              </div>
              <span className="text-sm font-semibold hidden sm:inline">Tiếng Việt</span>
            </button>

            <button type="button" className="hover:bg-white/10 p-2 rounded transition" aria-label="Trợ giúp">
              <HelpCircle className="h-5.5 w-5.5 text-white" />
            </button>

            <button type="button" className="relative hover:bg-white/10 p-2 rounded transition" aria-label="Thông báo">
              <Bell className="h-5.5 w-5.5 text-white" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#d4111e]" />
            </button>

            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm border border-white/40 cursor-pointer hover:bg-white/30 transition">
              K
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <nav className="bg-[#00224f] text-white overflow-x-auto border-t border-white/10">
          <div className="mx-auto flex max-w-[1400px] h-[52px] items-center px-6 text-sm font-medium gap-1 whitespace-nowrap">
            <Link href="/host" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5 flex items-center gap-1.5">
              <span>Trang chủ</span>
              <span className="bg-[#d4111e] text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full">6</span>
            </Link>
            <Link href={`/host/${propertyId}/calendar`} className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Giá & Tình trạng phòng trống
            </Link>
            <Link href={`/host/${propertyId}/promotions`} className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Chương trình khuyến mãi
            </Link>
            <Link href="/host/bookings" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Đặt phòng
            </Link>
            <Link href={`/host/${propertyId}`} className="px-3.5 py-4 border-b-2 border-blue-400 text-blue-400 bg-white/5 flex items-center gap-1.5">
              <span>Chỗ nghỉ</span>
              <span className="bg-[#d4111e] text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full">5</span>
            </Link>
            <Link href="/host/performance" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5 flex items-center gap-1.5">
              <span>Thúc đẩy hiệu suất</span>
              <span className="bg-[#d4111e] text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full">25</span>
            </Link>
            <Link href="/host/messages" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Hộp thư
            </Link>
            <Link href="/host/reviews" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Đánh giá của khách
            </Link>
            <Link href="/host/finance" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Tài chính
            </Link>
            <Link href="/host/analytics" className="px-3.5 py-4 border-b-2 border-transparent hover:bg-white/5">
              Phân tích
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Page Layout */}
      <main className="mx-auto max-w-[1100px] px-6 py-6">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-2 text-sm text-[#006ce4] mb-4">
          <Link href={`/host/${propertyId}`} className="hover:underline flex items-center">
            ‹ Quay lại
          </Link>
        </div>

        {/* Success / Error Banners */}
        {status && (
          <div className={`mb-6 border p-4 text-sm font-semibold rounded-[4px] shadow-sm flex items-center gap-3 ${
            status.type === "success" 
              ? "border-[#008009] bg-[#f3fbf4] text-[#008009]" 
              : "border-[#d4111e] bg-[#fdf3f4] text-[#d4111e]"
          }`}>
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{status.message}</span>
          </div>
        )}

        {/* KYP Additional Info Request Box */}
        <section className="mb-6 border border-[#febb02] bg-[#fffcf0] p-5 rounded-[4px] shadow-sm flex gap-4">
          <div className="h-7 w-7 rounded-full bg-[#febb02]/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5.5 w-5.5 text-[#e07b00]" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[#1a1a1a]">Yêu cầu bổ sung thông tin</h2>
            <p className="text-sm mt-1 text-[#474747] leading-relaxed">
              Quý vị sẽ cần cung cấp thêm thông tin KYP về chỗ nghỉ để tuân thủ các yêu cầu pháp lý và quy định pháp luật khác nhau. Vui lòng sử dụng đường link bên dưới để thêm thông tin. Để biết thêm chi tiết, hãy xem bài viết này trong Trợ giúp Đối tác.
            </p>
            <button
              type="button"
              className="mt-3.5 rounded-[4px] bg-[#006ce4] px-4 py-2 text-sm font-bold text-white hover:bg-[#005bb8] transition duration-150 shadow-sm"
            >
              Hoàn tất thông tin
            </button>
          </div>
        </section>

        {/* Title */}
        <h1 className="text-[28px] font-bold tracking-tight text-[#1a1a1a] mb-6">Tiện nghi phòng</h1>

        {/* Promo / New Amenities Alert Box */}
        {showPromoBanner && (
          <section className="mb-6 border border-gray-200 bg-white p-6 rounded-[4px] shadow-sm relative">
            <button
              type="button"
              onClick={() => setShowPromoBanner(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid gap-6 pr-6 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-[17px] font-bold text-[#1a1a1a] leading-snug">
                  Chúng tôi vừa thêm các tiện nghi mới vào truyền thông & công nghệ. Vui lòng dành vài phút để cập nhật những tiện nghi phù hợp với Quý vị.
                </h2>
              </div>
              <div className="md:border-l md:border-gray-200 md:pl-8 min-w-[260px]">
                <ul className="space-y-2.5 text-sm text-[#006ce4] font-semibold list-disc pl-4">
                  <li>Thiết bị phát Wi-Fi di động</li>
                  <li>Điện thoại thông minh</li>
                  <li>Dịch vụ streaming (như là Netflix)</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Warning Alert Box: Vẫn còn thiếu */}
        <section className="mb-6 border border-[#febb02] bg-[#fffcf0] p-6 rounded-[4px] shadow-sm flex gap-4">
          <div className="h-7 w-7 rounded-full bg-[#febb02]/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5.5 w-5.5 text-[#e07b00]" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#1a1a1a]">Vẫn còn thiếu:</h2>
            <ul className="mt-4 list-disc pl-5 space-y-3.5 text-sm text-[#474747]">
              <li>
                <span>Kích thước phòng</span>
                <ul className="list-disc pl-5 mt-1 text-[#006ce4] font-bold">
                  <li>
                    <span className="cursor-pointer hover:underline">{propertyName || "Căn Hộ 1 Phòng Ngủ"}</span>
                  </li>
                </ul>
              </li>
              <li>
                <span>Thông tin về </span>
                <span className="text-[#006ce4] font-bold cursor-pointer hover:underline">Các tiện nghi hàng đầu</span>
                <span> tại chỗ nghỉ</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Room Size Section */}
        <section className="mb-8 border border-gray-200 bg-white p-6 rounded-[4px] shadow-sm">
          <p className="text-sm text-[#474747] leading-relaxed">
            Chúng tôi hiển thị kích cỡ phòng cho khách thấy trên trang chỗ nghỉ của StaySaga.
          </p>

          <h3 className="mt-6 text-sm font-bold text-[#1a1a1a]">Quý vị muốn dùng đơn vị đo lường nào?</h3>
          <div className="mt-2.5 inline-flex rounded-[4px] overflow-hidden border border-[#006ce4]">
            <button
              type="button"
              onClick={() => setUnit("sqm")}
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                unit === "sqm" ? "bg-[#006ce4] text-white" : "bg-white text-[#006ce4] hover:bg-blue-50"
              }`}
            >
              mét vuông
            </button>
            <button
              type="button"
              onClick={() => setUnit("sqft")}
              className={`px-5 py-2 text-sm font-bold transition-colors border-l border-[#006ce4] ${
                unit === "sqft" ? "bg-[#006ce4] text-white" : "bg-white text-[#006ce4] hover:bg-blue-50"
              }`}
            >
              feet vuông
            </button>
          </div>

          <h3 className="mt-6 text-sm font-bold text-[#1a1a1a]">Vui lòng nhập kích cỡ (các) phòng</h3>
          <div className="mt-3.5 max-w-[400px]">
            <span className="text-sm font-semibold text-[#595959]">{propertyName || "Căn Hộ 1 Phòng Ngủ"}</span>
            <div className="mt-1.5 flex rounded-[4px] shadow-sm overflow-hidden">
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={`h-11 flex-1 border px-3 text-sm focus:outline-none focus:ring-1 ${
                  isAreaEmptyOrZero 
                    ? "border-[#d4111e] focus:ring-[#d4111e] focus:border-[#d4111e]" 
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                placeholder="0"
              />
              <span className="flex h-11 items-center border border-l-0 border-gray-300 bg-gray-50 px-4 text-sm text-[#595959]">
                {unit === "sqm" ? "m²" : "sq ft"}
              </span>
            </div>
            {isAreaEmptyOrZero && (
              <span className="mt-1.5 block text-xs text-[#d4111e] font-semibold">
                Hãy thêm kích thước phòng
              </span>
            )}
          </div>

          {/* Area smaller than average warning */}
          {isAreaTooSmall && (
            <div className="mt-6 border border-[#febb02] bg-[#fffcf0] p-4 rounded-[4px] flex gap-3 text-sm text-[#474747] leading-relaxed shadow-sm">
              <AlertCircle className="h-5 w-5 text-[#e07b00] shrink-0 mt-0.5" />
              <p>
                1 trong tổng các loại phòng của Quý vị có diện tích nhỏ hơn trung bình <strong>(dưới 6 m²)</strong>. Quý vị có thể kiểm tra lại những kích thước và diện tích này là chính xác không?
              </p>
            </div>
          )}
        </section>

        {/* Amenity Groups */}
        <AmenityGroupComponent
          title="Những tiện nghi tốt nhất"
          description="Chúng tôi biết chắc rằng các tiện nghi sẽ thu hút khách hàng đặt phòng. Hãy cho khách biết Quý vị phục vụ những gì bằng cách trả lời có hoặc không cho từng câu hỏi."
          items={topAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
          showPhotosIcon={true}
        />

        <AmenityGroupComponent
          title="Tiện ích trong phòng"
          items={roomAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Phòng tắm"
          items={bathroomAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Truyền thông & Công nghệ"
          items={mediaAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Đồ ăn & thức uống"
          items={foodAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Dịch vụ & Khoản phụ"
          items={serviceAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Ngoài trời & Tầm nhìn"
          items={outdoorAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Lối vào dành cho người khuyết tật"
          items={disabledAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Đặc tính tòa nhà"
          items={buildingAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Dịch vụ giải trí và gia đình"
          items={familyAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="An ninh"
          items={securityAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

        <AmenityGroupComponent
          title="Lau dọn & khử trùng"
          items={cleaningAmenities}
          selectedAmenities={selectedAmenities}
          onToggle={handleToggleAmenity}
        />

      </main>

      {/* Fixed Footer Bar */}
      <footer className="fixed inset-x-0 bottom-0 z-40 bg-[#0f294a]/95 py-4 border-t border-white/10 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1100px] justify-end px-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[4px] bg-[#006ce4] hover:bg-[#005bb8] px-8 py-3 text-base font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </footer>
    </form>
  );
}

// Sub-component for rendering each group of amenities with "Xem thêm / Thu gọn" toggles
function AmenityGroupComponent({
  title,
  description,
  items,
  selectedAmenities,
  onToggle,
  showPhotosIcon = false,
}: {
  title: string;
  description?: string;
  items: string[];
  selectedAmenities: Record<string, boolean>;
  onToggle: (name: string, isChecked: boolean) => void;
  showPhotosIcon?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const initialDisplayCount = 9;

  const displayedItems = isExpanded ? items : items.slice(0, initialDisplayCount);
  const hasMore = items.length > initialDisplayCount;

  return (
    <section className="mb-6 border border-gray-200 bg-white p-6 rounded-[4px] shadow-sm">
      <h2 className="text-[20px] font-bold text-[#1a1a1a]">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-[#595959] leading-relaxed">
          {description}
        </p>
      )}

      <div className="mt-4 divide-y divide-gray-150">
        {displayedItems.map((item, idx) => {
          const isSelected = selectedAmenities[item] === true;
          const isNew = newItems.has(item);

          return (
            <div key={item} className="grid items-center gap-4 py-3.5 md:grid-cols-[1fr_auto_auto]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1a1a1a]">{item}</span>
                {isNew && (
                  <span className="rounded-[3px] bg-[#008009] px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Mới!
                  </span>
                )}
              </div>

              {/* Yes/No Toggles styled exactly like Booking.com */}
              <div className="inline-flex rounded-[4px] overflow-hidden border border-gray-300">
                <button
                  type="button"
                  onClick={() => onToggle(item, true)}
                  className={`h-9 px-5 text-sm font-bold transition-all ${
                    isSelected
                      ? "bg-[#006ce4] text-white border-r border-[#006ce4]"
                      : "bg-white text-[#006ce4] hover:bg-blue-50 border-r border-gray-300"
                  }`}
                >
                  Có
                </button>
                <button
                  type="button"
                  onClick={() => onToggle(item, false)}
                  className={`h-9 px-5 text-sm font-bold transition-all ${
                    !isSelected
                      ? "bg-[#006ce4] text-white"
                      : "bg-white text-[#006ce4] hover:bg-blue-50"
                  }`}
                >
                  Không
                </button>
              </div>

              {/* Photo Upload Icon placeholder for top amenities */}
              {showPhotosIcon && idx > 0 && idx < 5 ? (
                <button
                  type="button"
                  className="inline-flex h-9 w-12 items-center justify-center rounded-[4px] border border-[#006ce4] text-[#006ce4] hover:bg-blue-50 transition"
                  aria-label={`Thêm ảnh cho ${item}`}
                >
                  <Camera className="h-4.5 w-4.5" />
                </button>
              ) : (
                <span className="hidden h-9 w-12 md:block" />
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 inline-flex items-center gap-1.5 font-bold text-sm text-[#006ce4] hover:underline transition"
        >
          {isExpanded ? (
            <>
              Thu gọn
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Xem thêm
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </section>
  );
}
