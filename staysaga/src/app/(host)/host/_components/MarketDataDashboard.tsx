"use client";

import { useState } from "react";
import {
  CalendarDays,
  UsersRound,
  Compass,
  Globe2,
  Smartphone,
  Tag,
  AlertCircle,
  Check,
  ChevronLeft,
  X,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Search,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

type Listing = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
};

type MarketDataDashboardProps = {
  listings: Listing[];
};

export function MarketDataDashboard({ listings }: MarketDataDashboardProps) {
  // Navigation states: "dashboard" | "mobile-wizard" | "non-refundable-wizard"
  const [wizardType, setWizardType] = useState<"mobile" | "non-refundable" | null>(null);
  const [view, setView] = useState<"dashboard" | "step1" | "step2" | "step3">("dashboard");

  // Selection state
  const [selectedListings, setSelectedListings] = useState<string[]>([]);

  // ==========================================
  // WIZARD 1: MOBILE RATE CONFIG STATE
  // ==========================================
  const [mobileChannel, setMobileChannel] = useState<"both" | "app">("both");
  const [mobileDiscount, setMobileDiscount] = useState<number>(10);
  const [mobileBlackoutDates, setMobileBlackoutDates] = useState<string[]>([]);
  const [mobileLengthOfStay, setMobileLengthOfStay] = useState<string>("Theo loại giá");
  const [mobileBookingWindow, setMobileBookingWindow] = useState<string>("Bất kỳ lúc nào trước khi nhận phòng");

  // Modals state for Mobile Rate
  const [editingLimit, setEditingLimit] = useState<"blackout" | "stay" | "window" | null>(null);
  const [tempDate, setTempDate] = useState("");
  const [tempStayVal, setTempStayVal] = useState("Theo loại giá");
  const [tempStayNights, setTempStayNights] = useState("2");
  const [tempWindowVal, setTempWindowVal] = useState("Bất kỳ lúc nào trước khi nhận phòng");
  const [tempWindowDays, setTempWindowDays] = useState("3");

  // ==========================================
  // WIZARD 2: NON-REFUNDABLE CONFIG STATE
  // ==========================================
  const [nrName, setNrName] = useState("Non-refundable");
  const [nrDiscount, setNrDiscount] = useState(10);
  const [nrSyncLimits, setNrSyncLimits] = useState<"no" | "yes">("no");
  const [nrMinStay, setNrMinStay] = useState<"no" | "yes">("no");
  const [nrMinStayNights, setNrMinStayNights] = useState(2);
  const [nrWindow, setNrWindow] = useState<"any" | "limit">("any");
  const [nrWindowDays, setNrWindowDays] = useState(3);

  // Step 2 custom selectors for Non-refundable
  const [searchQuery, setSearchQuery] = useState("");
  const [openRateDropdown, setOpenRateDropdown] = useState<string | null>(null); // listing ID
  const [openRoomDropdown, setOpenRoomDropdown] = useState<string | null>(null); // listing ID
  const [listingRates, setListingRates] = useState<Record<string, string[]>>({}); // listing ID -> selected rates
  const [listingRooms, setListingRooms] = useState<Record<string, string>>({}); // listing ID -> selected room type

  // Init Mobile Wizard
  const startMobileWizard = () => {
    setWizardType("mobile");
    setMobileChannel("both");
    setMobileDiscount(10);
    setSelectedListings(listings.map(l => l.id));
    setMobileBlackoutDates([]);
    setMobileLengthOfStay("Theo loại giá");
    setMobileBookingWindow("Bất kỳ lúc nào trước khi nhận phòng");
    setView("step1");
  };

  // Init Non-Refundable Wizard
  const startNonRefundableWizard = () => {
    setWizardType("non-refundable");
    setNrName("Non-refundable");
    setNrDiscount(10);
    setNrSyncLimits("no");
    setNrMinStay("no");
    setNrMinStayNights(2);
    setNrWindow("any");
    setNrWindowDays(3);
    setSelectedListings(listings.map(l => l.id));
    
    // Set default selected sub-rates and room categories for Step 2
    const ratesInit: Record<string, string[]> = {};
    const roomsInit: Record<string, string> = {};
    listings.forEach(l => {
      ratesInit[l.id] = ["Weekly Rate-One Bedroom"];
      roomsInit[l.id] = "Căn Hộ 1 Phòng Ngủ";
    });
    setListingRates(ratesInit);
    setListingRooms(roomsInit);
    setSearchQuery("");
    setView("step1");
  };

  const handleFeedback = () => {
    toast.success("Cảm ơn Quý vị đã gửi phản hồi!");
  };

  const selectAllListings = () => {
    if (selectedListings.length === listings.length) {
      setSelectedListings([]);
    } else {
      setSelectedListings(listings.map(l => l.id));
    }
  };

  const toggleListing = (id: string) => {
    if (selectedListings.includes(id)) {
      setSelectedListings(selectedListings.filter(item => item !== id));
    } else {
      setSelectedListings([...selectedListings, id]);
    }
  };

  // Mobile limit handlers
  const handleSaveBlackout = () => {
    if (tempDate) {
      if (!mobileBlackoutDates.includes(tempDate)) {
        setMobileBlackoutDates([...mobileBlackoutDates, tempDate]);
      }
      setTempDate("");
    }
  };

  const handleRemoveBlackout = (date: string) => {
    setMobileBlackoutDates(mobileBlackoutDates.filter(d => d !== date));
  };

  const saveStayLimit = () => {
    if (tempStayVal === "Theo loại giá") {
      setMobileLengthOfStay("Theo loại giá");
    } else {
      setMobileLengthOfStay(`Tối thiểu ${tempStayNights} đêm`);
    }
    setEditingLimit(null);
  };

  const saveWindowLimit = () => {
    if (tempWindowVal === "Bất kỳ lúc nào trước khi nhận phòng") {
      setMobileBookingWindow("Bất kỳ lúc nào trước khi nhận phòng");
    } else {
      setMobileBookingWindow(`Chỉ đặt trước tối đa ${tempWindowDays} ngày`);
    }
    setEditingLimit(null);
  };

  // Toggle rate sub-type checkbox in Step 2 of Non-refundable
  const toggleRateType = (listingId: string, rate: string) => {
    const current = listingRates[listingId] || [];
    if (current.includes(rate)) {
      setListingRates({ ...listingRates, [listingId]: current.filter(r => r !== rate) });
    } else {
      setListingRates({ ...listingRates, [listingId]: [...current, rate] });
    }
  };

  // Set selected room category in Step 2 of Non-refundable
  const selectRoomType = (listingId: string, room: string) => {
    setListingRooms({ ...listingRooms, [listingId]: room });
    setOpenRoomDropdown(null);
  };

  // Finish logic
  const finishWizard = () => {
    if (wizardType === "mobile") {
      toast.success("Khuyến mãi Giá trên điện thoại đã được kích hoạt thành công!");
    } else {
      toast.success("Khuyến mãi Giá không hoàn tiền đã được áp dụng thành công!");
    }
    setView("dashboard");
    setWizardType(null);
  };

  // FILTERED LISTINGS FOR SEARCH
  const filteredListings = listings.filter(l => 
    (l.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (l.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.includes(searchQuery)
  );

  // =========================================================================
  // VIEW: DASHBOARD
  // =========================================================================
  if (view === "dashboard") {
    return (
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1a1a1a]">Phân tích</h1>
          <p className="mt-2 text-[15px] text-slate-600">
            Phân tích các đặt phòng có sẵn để lên kế hoạch trong tương lai
          </p>
        </div>

        <h2 className="mb-6 text-2xl font-black text-[#1a1a1a]">Dữ liệu thị trường</h2>

        {/* Core Card */}
        <section className="border border-slate-200 bg-white p-6 shadow-sm rounded-sm">
          <h3 className="text-xl font-bold text-[#1a1a1a]">
            Dữ liệu nhu cầu của khách trên StaySaga đối với quốc gia Quý vị đã chọn
          </h3>
          <p className="mt-1 text-[14px] text-slate-500">
            Tìm hiểu thêm về những du khách quan tâm đến các địa điểm Quý vị đã chọn và thời điểm họ dự định lưu trú.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
            
            {/* Box 1: Thời gian đặt trước */}
            <div className="flex flex-col justify-between border-b border-slate-100 pb-8 lg:border-b-0 lg:pb-0">
              <div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <CalendarDays className="h-6 w-6 text-[#f60057]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a]">Thời gian đặt trước</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Hầu hết những tìm kiếm đối với các quốc gia Quý vị đã chọn có thời gian đặt trước là 0-1 ngày.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pl-16">
                  {[
                    { label: "0-1 ngày", val: "0%" },
                    { label: "2-7 ngày", val: "0%" },
                    { label: "8-30 ngày", val: "0%" },
                    { label: "31-90 ngày", val: "0%" },
                    { label: "91+ ngày", val: "0%" }
                  ].map((row, idx) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>{row.label}</span>
                        <span>{row.val}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full">
                        <div className="h-full w-0 bg-[#f60057] transition-all duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 2: Loại khách */}
            <div className="flex flex-col justify-between border-b border-slate-100 pb-8 lg:border-b-0 lg:pb-0">
              <div className="flex-1">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <UsersRound className="h-6 w-6 text-[#f60057]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a]">Loại khách</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Hầu hết tìm kiếm đối với quốc gia Quý vị đã chọn là từ khách lẻ.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pl-16">
                  {[
                    { label: "Khách lẻ", val: "0%" },
                    { label: "Cặp đôi", val: "0%" },
                    { label: "Gia đình", val: "0%" },
                    { label: "Nhóm", val: "0%" }
                  ].map((row, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>{row.label}</span>
                        <span>{row.val}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full">
                        <div className="h-full w-0 bg-[#f60057]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pl-16">
                <button
                  onClick={() => toast.success("Đã mở thiết lập giá trẻ em")}
                  className="rounded-sm border border-[#f60057] px-4 py-2 text-sm font-bold text-[#f60057] hover:bg-[#f60057]/5 transition cursor-pointer"
                >
                  Thêm giá trẻ em
                </button>
              </div>
            </div>

            {/* Box 3: Khách trong nước và quốc tế */}
            <div className="flex flex-col justify-between border-b border-slate-100 pb-8 lg:border-b-0 lg:pb-0">
              <div className="flex-1">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Compass className="h-6 w-6 text-[#f60057]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a]">Khách trong nước và quốc tế</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Hầu hết những tìm kiếm đối với các quốc gia Quý vị đã chọn là từ khách đi một mình.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pl-16">
                  {[
                    { label: "Trong nước", val: "0%" },
                    { label: "Quốc tế", val: "0%" }
                  ].map((row, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>{row.label}</span>
                        <span>{row.val}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full">
                        <div className="h-full w-0 bg-[#f60057]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pl-16">
                <button
                  onClick={() => toast.success("Đã mở thiết lập giá theo quốc gia")}
                  className="rounded-sm border border-[#f60057] px-4 py-2 text-sm font-bold text-[#f60057] hover:bg-[#f60057]/5 transition cursor-pointer"
                >
                  Thêm loại giá theo quốc gia
                </button>
              </div>
            </div>

            {/* Box 4: Top 5 quốc gia */}
            <div className="flex flex-col justify-between border-b border-slate-100 pb-8 lg:border-b-0 lg:pb-0">
              <div className="flex-1">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Globe2 className="h-6 w-6 text-[#f60057]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a]">Top 5 quốc gia</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Danh sách các quốc gia tìm kiếm chỗ nghỉ của bạn nhiều nhất.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pl-16">
                  <div className="flex justify-between text-sm font-medium text-slate-400">
                    <span>Chưa có dữ liệu quốc gia</span>
                    <span>0%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full">
                    <div className="h-full w-0 bg-[#f60057]" />
                  </div>
                </div>
              </div>
              <div className="mt-6 pl-16">
                <button
                  onClick={() => toast.success("Đã mở thiết lập giá theo quốc gia")}
                  className="rounded-sm border border-[#f60057] px-4 py-2 text-sm font-bold text-[#f60057] hover:bg-[#f60057]/5 transition cursor-pointer"
                >
                  Thêm loại giá theo quốc gia
                </button>
              </div>
            </div>

            {/* Box 5: Thiết bị */}
            <div className="flex flex-col justify-between">
              <div className="flex-1">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Smartphone className="h-6 w-6 text-[#f60057]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a]">Thiết bị</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Hầu hết tìm kiếm là từ thiết bị di động.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pl-16">
                  {[
                    { label: "Thiết bị di động", val: "0%" },
                    { label: "Máy tính", val: "0%" },
                    { label: "Thiết bị khác", val: "0%" }
                  ].map((row, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>{row.label}</span>
                        <span>{row.val}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full">
                        <div className="h-full w-0 bg-[#f60057]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pl-16">
                <button
                  onClick={startMobileWizard}
                  className="rounded-sm border border-[#f60057] px-4 py-2 text-sm font-bold text-[#f60057] hover:bg-[#f60057]/5 transition cursor-pointer"
                >
                  Thêm loại giá cho thiết bị di động
                </button>
              </div>
            </div>

            {/* Box 6: Chính sách hủy */}
            <div className="flex flex-col justify-between">
              <div className="flex-1">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <Tag className="h-6 w-6 text-[#f60057]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1a1a]">Chính sách hủy</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Hầu hết khách lưu trú tại các quốc gia Quý vị đã chọn đều đặt phòng hủy miễn phí.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pl-16">
                  {[
                    { label: "Hủy miễn phí", val: "50%", width: "w-1/2" },
                    { label: "Hoàn tiền một phần", val: "25%", width: "w-1/4" },
                    { label: "Không hoàn tiền", val: "25%", width: "w-1/4" },
                    { label: "Không rõ", val: "0%", width: "w-0" }
                  ].map((row, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm font-medium text-slate-700">
                        <span>{row.label}</span>
                        <span>{row.val}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${row.width} bg-[#f60057] rounded-full transition-all duration-300`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pl-16">
                <button
                  onClick={startNonRefundableWizard}
                  className="rounded-sm border border-[#f60057] px-4 py-2 text-sm font-bold text-[#f60057] hover:bg-[#f60057]/5 transition cursor-pointer"
                >
                  Thêm loại giá không hoàn tiền
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Feedback Banner Box (Branded to light pink/rose) */}
        <section className="mt-8 border border-rose-100 bg-[#fef2f4] p-5 rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[15px] font-medium text-slate-700">
            Phản hồi của Quý vị rất quan trọng với chúng tôi. Quý vị thấy dữ liệu này có hữu ích không?
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFeedback}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#f60057] transition shadow-sm cursor-pointer"
            >
              <ThumbsUp className="h-5 w-5" />
            </button>
            <button
              onClick={handleFeedback}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#f60057] transition shadow-sm cursor-pointer"
            >
              <ThumbsDown className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Footer (StaySaga Red-Pink Branded) */}
        <footer className="mt-16 border-t border-slate-200 pt-8 pb-12 text-sm text-slate-500">
          <div className="flex flex-wrap justify-between gap-6">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a href="#" className="hover:underline">Giới thiệu về chúng tôi</a>
              <span>·</span>
              <a href="#" className="hover:underline">Chính sách Bảo mật và Cookie</a>
              <span>·</span>
              <a href="#" className="hover:underline">Các Câu Hỏi Thường Gặp</a>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => toast.success("Mở trang đăng ký chỗ nghỉ mới")}
                className="bg-[#f60057] text-white px-4 py-2 font-bold hover:bg-[#f60057]/90 transition rounded-sm text-xs cursor-pointer"
              >
                Thêm chỗ nghỉ mới
              </button>
              <button
                onClick={() => toast.success("Cảm ơn đóng góp của bạn!")}
                className="border border-[#f60057] text-[#f60057] px-4 py-2 font-bold hover:bg-[#f60057]/5 transition rounded-sm text-xs cursor-pointer"
              >
                Chia sẻ góp ý của Quý vị
              </button>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400">© Bản quyền StaySaga 2026</p>
        </footer>
      </main>
    );
  }

  // =========================================================================
  // STEPPER HEADER FOR WIZARDS
  // =========================================================================
  const renderStepperHeader = (currentStep: 1 | 2 | 3) => {
    const steps =
      wizardType === "mobile"
        ? [
            { id: 1, label: "Cài đặt chương trình khuyến mãi" },
            { id: 2, label: "Chọn chỗ nghỉ" },
            { id: 3, label: "Kiểm tra và xác nhận" }
          ]
        : [
            { id: 1, label: "Chọn cài đặt của bạn" },
            { id: 2, label: "Chọn chỗ nghỉ" },
            { id: 3, label: "Kiểm tra và xác nhận" }
          ];

    const wizardTitle = wizardType === "mobile" ? "Thêm khuyến mãi mới" : "Thêm giá không hoàn tiền";

    return (
      <div className="mb-10 border-b border-slate-200 bg-white pb-6">
        <div className="mx-auto max-w-[1000px] px-6 pt-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-[#1a1a1a]">{wizardTitle}</h1>
            <button 
              onClick={() => { setView("dashboard"); setWizardType(null); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.id;
              const isCompleted = currentStep > s.id;
              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border transition ${
                        isActive
                          ? "bg-[#f60057] border-[#f60057] text-white"
                          : isCompleted
                          ? "bg-[#f60057] border-[#f60057] text-white" // Keep branding pink-red consistent!
                          : "border-slate-300 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : s.id}
                    </span>
                    <span
                      className={`text-[15px] font-bold ${
                        isActive ? "text-[#f60057]" : isCompleted ? "text-[#f60057]/80" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block mx-6 h-px flex-1 bg-slate-300 min-w-[50px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // WIZARD VIEW: STEP 1
  // =========================================================================
  if (view === "step1") {
    return (
      <div className="min-h-screen bg-[#f3f3f3]">
        {renderStepperHeader(1)}

        <div className="mx-auto max-w-[1000px] px-6 pb-24 space-y-6">
          
          {wizardType === "mobile" ? (
            /* MOBILE WIZARD STEP 1 CONTENT */
            <>
              {/* Card: Kênh */}
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Kênh</h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:border-slate-300 cursor-pointer transition">
                    <input
                      type="radio"
                      name="channel"
                      checked={mobileChannel === "both"}
                      onChange={() => setMobileChannel("both")}
                      className="mt-1 h-4 w-4 accent-[#f60057]"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 text-[15px]">Ứng dụng và trang web trên điện thoại</span>
                      <p className="text-xs text-slate-500 mt-0.5">Tiếp cận đối tượng khách hàng rộng lớn nhất duyệt phòng trên trình duyệt di động lẫn app</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:border-slate-300 cursor-pointer transition">
                    <input
                      type="radio"
                      name="channel"
                      checked={mobileChannel === "app"}
                      onChange={() => setMobileChannel("app")}
                      className="mt-1 h-4 w-4 accent-[#f60057]"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 text-[15px]">Chỉ trong ứng dụng</span>
                      <p className="text-xs text-slate-500 mt-0.5">Mức chiết khấu cao nhắm cụ thể vào lượng khách hàng trung thành trên ứng dụng di động</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card: Giảm giá */}
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Giảm giá</h3>
                <div className="flex items-center gap-3">
                  <div className="relative rounded-sm border border-slate-300 px-3 py-2 flex items-center focus-within:ring-1 focus-within:ring-[#f60057] focus-within:border-[#f60057]">
                    <input
                      type="number"
                      min="5"
                      max="99"
                      value={mobileDiscount}
                      onChange={(e) => setMobileDiscount(Number(e.target.value))}
                      className="w-16 font-bold text-lg text-slate-800 outline-none"
                    />
                    <span className="text-slate-500 font-bold border-l border-slate-200 pl-2 ml-1">%</span>
                  </div>
                </div>
                
                <div className="mt-4 border border-amber-200 bg-amber-50/50 p-4 rounded text-sm text-amber-800 space-y-2">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        Kết hợp được với: <span className="font-normal text-slate-700">Genius, ưu đãi cơ bản, ưu đãi phút chót, ưu đãi đặt sớm và ưu đãi bí mật.</span>
                      </p>
                      <p className="font-semibold mt-1">
                        Không kết hợp được với: <span className="font-normal text-slate-700">Giá theo quốc gia và ưu đãi trong thời gian có hạn. Trong những trường hợp này, mức giảm giá cao hơn sẽ được hiển thị cho khách.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Tùy chỉnh */}
              <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
                <h3 className="text-lg font-bold text-[#1a1a1a]">Tùy chỉnh giá trên điện thoại</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Thêm giới hạn để thu hẹp phạm vi tiếp cận và nhắm đến đối tượng khách hàng cụ thể hơn
                </p>

                <div className="divide-y divide-slate-100">
                  
                  {/* Row 1: Ngày không áp dụng */}
                  <div className="py-4 flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-[15px]">Ngày không áp dụng khuyến mãi</h4>
                      <div className="text-[14px] text-slate-500 mt-1">
                        {mobileBlackoutDates.length === 0 ? (
                          "Chưa có ngày nào"
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {mobileBlackoutDates.map(d => (
                              <span key={d} className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded text-xs text-slate-700 font-semibold border border-slate-200">
                                {d}
                                <button onClick={() => handleRemoveBlackout(d)} className="text-slate-400 hover:text-red-500">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTempDate("");
                        setEditingLimit("blackout");
                      }}
                      className="text-[#f60057] hover:text-[#f60057]/90 font-bold text-[14px] hover:underline cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  </div>

                  {/* Row 2: Độ dài lưu trú */}
                  <div className="py-4 flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-[15px]">Độ dài lưu trú</h4>
                      <p className="text-[14px] text-slate-500 mt-1">{mobileLengthOfStay}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTempStayVal(mobileLengthOfStay.startsWith("Tối thiểu") ? "min" : "Theo loại giá");
                        if (mobileLengthOfStay.startsWith("Tối thiểu")) {
                          const match = mobileLengthOfStay.match(/\d+/);
                          setTempStayNights(match ? match[0] : "2");
                        } else {
                          setTempStayNights("2");
                        }
                        setEditingLimit("stay");
                      }}
                      className="text-[#f60057] hover:text-[#f60057]/90 font-bold text-[14px] hover:underline cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  </div>

                  {/* Row 3: Thời gian đặt trước */}
                  <div className="py-4 flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-[15px]">Thời gian đặt trước</h4>
                      <p className="text-[14px] text-slate-500 mt-1">{mobileBookingWindow}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTempWindowVal(mobileBookingWindow.startsWith("Chỉ đặt trước") ? "limit" : "Bất kỳ lúc nào trước khi nhận phòng");
                        if (mobileBookingWindow.startsWith("Chỉ đặt trước")) {
                          const match = mobileBookingWindow.match(/\d+/);
                          setTempWindowDays(match ? match[0] : "3");
                        } else {
                          setTempWindowDays("3");
                        }
                        setEditingLimit("window");
                      }}
                      className="text-[#f60057] hover:text-[#f60057]/90 font-bold text-[14px] hover:underline cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  </div>

                </div>
              </div>
            </>
          ) : (
            /* NON-REFUNDABLE RATE WIZARD STEP 1 CONTENT (AS SHOWN IN THE IMAGES) */
            <>
              {/* Card Container for all setting questions */}
              <div className="bg-white border border-slate-200 p-8 rounded-sm shadow-sm space-y-8">
                <p className="text-[15px] text-slate-600 font-medium">
                  Chọn cài đặt của loại giá không hoàn tiền
                </p>

                {/* Section 1: Đặt tên */}
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-[#1a1a1a]">Quý vị có muốn đặt tên cho loại giá này không?</h4>
                  <input
                    type="text"
                    value={nrName}
                    onChange={(e) => setNrName(e.target.value)}
                    className="w-full max-w-md rounded border border-slate-300 px-3.5 py-2.5 text-slate-800 font-semibold outline-none focus:ring-1 focus:ring-[#f60057] focus:border-[#f60057]"
                  />
                  <p className="text-xs text-slate-500">Tên này chỉ dành cho Quý vị. Chúng tôi sẽ không hiển thị cho khách thấy trên StaySaga.</p>
                </div>

                {/* Section 2: Giảm giá */}
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-[#1a1a1a]">Quý vị muốn cài đặt giảm giá cho loại giá này như thế nào?</h4>
                  <div className="flex items-center gap-2">
                    <div className="relative rounded border border-slate-300 px-3.5 py-2.5 flex items-center focus-within:ring-1 focus-within:ring-[#f60057] focus-within:border-[#f60057] max-w-[120px]">
                      <input
                        type="number"
                        min="5"
                        max="99"
                        value={nrDiscount}
                        onChange={(e) => setNrDiscount(Number(e.target.value))}
                        className="w-full font-bold text-[16px] text-slate-800 outline-none"
                      />
                      <span className="text-slate-500 font-bold border-l border-slate-200 pl-2 ml-1">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Giảm giá này sẽ được áp dụng cho các chỗ nghỉ và loại giá Quý vị chọn trong bước tiếp theo</p>
                </div>

                {/* Section 3: Đồng bộ các giới hạn */}
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-[#1a1a1a]">Quý vị có muốn đồng bộ hóa các giới hạn với loại giá khác không?</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="nrSync"
                        checked={nrSyncLimits === "no"}
                        onChange={() => setNrSyncLimits("no")}
                        className="h-4.5 w-4.5 accent-[#f60057]"
                      />
                      <span className="text-sm font-semibold text-slate-700">Không, tôi sẽ tự cài đặt giới hạn</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="nrSync"
                        checked={nrSyncLimits === "yes"}
                        onChange={() => setNrSyncLimits("yes")}
                        className="h-4.5 w-4.5 accent-[#f60057]"
                      />
                      <span className="text-sm font-semibold text-slate-700">Có, đồng bộ các giới hạn với loại giá khác</span>
                    </label>
                  </div>
                  {nrSyncLimits === "yes" && (
                    <p className="text-xs text-[#f60057] font-semibold pl-7">Nếu Quý vị chọn đồng bộ các giới hạn với loại giá khác thì bất kỳ cập nhật nào đối với loại giá được chọn trong tương lai đều sẽ được áp dụng cho loại giá này.</p>
                  )}
                </div>

                {/* Section 4: Lưu trú tối thiểu */}
                <div className="space-y-3">
                  <h4 className="text-base font-bold text-[#1a1a1a]">Quý vị có muốn thiết lập thời gian lưu trú tối thiểu cho loại giá này không?</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="nrStay"
                        checked={nrMinStay === "no"}
                        onChange={() => setNrMinStay("no")}
                        className="h-4.5 w-4.5 accent-[#f60057]"
                      />
                      <span className="text-sm font-semibold text-slate-700">Không (loại giá này dùng được cho tất cả các độ dài lưu trú)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="nrStay"
                        checked={nrMinStay === "yes"}
                        onChange={() => setNrMinStay("yes")}
                        className="h-4.5 w-4.5 accent-[#f60057]"
                      />
                      <span className="text-sm font-semibold text-slate-700">Có</span>
                    </label>
                    {nrMinStay === "yes" && (
                      <div className="pl-7 mt-2">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={nrMinStayNights}
                          onChange={(e) => setNrMinStayNights(Number(e.target.value))}
                          className="w-24 rounded border border-slate-300 px-3 py-2 text-slate-800 font-bold outline-none focus:ring-1 focus:ring-[#f60057] focus:border-[#f60057]"
                        />
                        <span className="text-sm text-slate-500 font-semibold ml-2">đêm</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Đặt trước bao nhiêu ngày */}
                <div className="space-y-3 font-medium">
                  <h4 className="text-base font-bold text-[#1a1a1a]">Khách có thể đặt với loại giá này bao nhiêu ngày trước khi nhận phòng?</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="nrWindow"
                        checked={nrWindow === "any"}
                        onChange={() => setNrWindow("any")}
                        className="h-4.5 w-4.5 accent-[#f60057]"
                      />
                      <span className="text-sm font-semibold text-slate-700">Bất cứ lúc nào (loại giá này luôn hoạt động)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="nrWindow"
                        checked={nrWindow === "limit"}
                        onChange={() => setNrWindow("limit")}
                        className="h-4.5 w-4.5 accent-[#f60057]"
                      />
                      <span className="text-sm font-semibold text-slate-700">Cài đặt số ngày trước khi nhận phòng</span>
                    </label>
                    {nrWindow === "limit" && (
                      <div className="pl-7 mt-2">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={nrWindowDays}
                          onChange={(e) => setNrWindowDays(Number(e.target.value))}
                          className="w-24 rounded border border-slate-300 px-3 py-2 text-slate-800 font-bold outline-none focus:ring-1 focus:ring-[#f60057] focus:border-[#f60057]"
                        />
                        <span className="text-sm text-slate-500 font-semibold ml-2">ngày trước khi nhận phòng</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Action Buttons (Strict StaySaga Pinkish-Red Color `#f60057`) */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => { setView("dashboard"); setWizardType(null); }}
              className="px-6 py-2.5 rounded-sm border border-[#f60057] text-[#f60057] font-bold hover:bg-[#f60057]/5 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={() => setView("step2")}
              className="bg-[#f60057] text-white px-8 py-2.5 rounded-sm font-bold hover:bg-[#f60057]/90 transition shadow-sm cursor-pointer"
            >
              Chọn chỗ nghỉ
            </button>
          </div>

        </div>

        {/* Custom Mobile modols - Color updated to `#f60057` */}
        {editingLimit === "blackout" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-bold text-lg text-slate-800">Chọn ngày không áp dụng</h4>
                <button onClick={() => setEditingLimit(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="flex-1 rounded border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:ring-1 focus:ring-[#f60057] focus:border-[#f60057]"
                  />
                  <button
                    onClick={handleSaveBlackout}
                    className="bg-[#f60057] text-white px-4 py-2 font-bold hover:bg-[#f60057]/90 transition rounded cursor-pointer shrink-0"
                  >
                    Thêm
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {mobileBlackoutDates.length === 0 ? (
                    <p className="text-slate-500 text-sm py-4 text-center">Chưa chọn ngày loại trừ nào</p>
                  ) : (
                    mobileBlackoutDates.map(d => (
                      <div key={d} className="flex justify-between items-center py-2">
                        <span className="text-slate-700 font-medium text-sm">{d}</span>
                        <button onClick={() => handleRemoveBlackout(d)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setEditingLimit(null)}
                  className="bg-[#f60057] text-white px-6 py-2 font-bold rounded text-sm hover:bg-[#f60057]/90 transition cursor-pointer"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Length of stay Modal */}
        {editingLimit === "stay" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-bold text-lg text-slate-800">Độ dài lưu trú tối thiểu</h4>
                <button onClick={() => setEditingLimit(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 py-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="stay-opt"
                    checked={tempStayVal === "Theo loại giá"}
                    onChange={() => setTempStayVal("Theo loại giá")}
                    className="h-4 w-4 accent-[#f60057]"
                  />
                  <span className="text-sm font-semibold text-slate-700">Theo loại giá mặc định (Không áp đặt thêm giới hạn)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="stay-opt"
                    checked={tempStayVal === "min"}
                    onChange={() => setTempStayVal("min")}
                    className="h-4 w-4 accent-[#f60057]"
                  />
                  <span className="text-sm font-semibold text-slate-700">Giới hạn số đêm ở tối thiểu:</span>
                </label>

                {tempStayVal === "min" && (
                  <div className="pl-7">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={tempStayNights}
                      onChange={(e) => setTempStayNights(e.target.value)}
                      className="w-24 rounded border border-slate-300 px-3 py-2 text-slate-800 font-bold outline-none focus:ring-1 focus:ring-[#f60057] focus:border-[#f60057]"
                    />
                    <span className="text-sm text-slate-500 font-semibold ml-2">đêm</span>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingLimit(null)}
                  className="border border-slate-300 text-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={saveStayLimit}
                  className="bg-[#f60057] text-white px-6 py-2 font-bold rounded text-sm hover:bg-[#f60057]/90 transition cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking window Modal */}
        {editingLimit === "window" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h4 className="font-bold text-lg text-slate-800">Thời gian đặt trước tối thiểu</h4>
                <button onClick={() => setEditingLimit(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 py-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="window-opt"
                    checked={tempWindowVal === "Bất kỳ lúc nào trước khi nhận phòng"}
                    onChange={() => setTempWindowVal("Bất kỳ lúc nào trước khi nhận phòng")}
                    className="h-4 w-4 accent-[#f60057]"
                  />
                  <span className="text-sm font-semibold text-slate-700">Bất kỳ lúc nào trước khi nhận phòng</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="window-opt"
                    checked={tempWindowVal === "limit"}
                    onChange={() => setTempWindowVal("limit")}
                    className="h-4 w-4 accent-[#f60057]"
                  />
                  <span className="text-sm font-semibold text-slate-700">Chỉ cho khách đặt trước tối đa:</span>
                </label>

                {tempWindowVal === "limit" && (
                  <div className="pl-7">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={tempWindowDays}
                      onChange={(e) => setTempWindowDays(e.target.value)}
                      className="w-24 rounded border border-slate-300 px-3 py-2 text-slate-800 font-bold outline-none focus:ring-1 focus:ring-[#f60057] focus:border-[#f60057]"
                    />
                    <span className="text-sm text-slate-500 font-semibold ml-2">ngày trước khi nhận phòng</span>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingLimit(null)}
                  className="border border-slate-300 text-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={saveWindowLimit}
                  className="bg-[#f60057] text-white px-6 py-2 font-bold rounded text-sm hover:bg-[#f60057]/90 transition cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // WIZARD VIEW: STEP 2 (SELECT PROPERTIES)
  // =========================================================================
  if (view === "step2") {
    return (
      <div className="min-h-screen bg-[#f3f3f3]">
        {renderStepperHeader(2)}

        <div className="mx-auto max-w-[1000px] px-6 pb-24 space-y-6">
          
          {wizardType === "mobile" ? (
            /* MOBILE STEP 2 */
            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a1a]">Chọn chỗ nghỉ áp dụng</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Chọn những chỗ nghỉ/homestay bạn muốn áp dụng ưu đãi này</p>
                </div>
                {listings.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[#f60057]">
                    <input
                      type="checkbox"
                      checked={selectedListings.length === listings.length}
                      onChange={selectAllListings}
                      className="h-4.5 w-4.5 accent-[#f60057] rounded-sm"
                    />
                    <span>Chọn tất cả</span>
                  </label>
                )}
              </div>

              {listings.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="font-bold text-lg">Bạn chưa có homestay nào để chọn</p>
                  <p className="text-sm mt-1">Vui lòng tạo homestay mới từ trang quản trị của chủ nhà.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-2">
                  {listings.map((item) => {
                    const isChecked = selectedListings.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-start gap-4 py-4 hover:bg-slate-50 px-2 rounded transition cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleListing(item.id)}
                          className="mt-1 h-4.5 w-4.5 accent-[#f60057] rounded-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-[15px] block">{item.name || "Chỗ nghỉ chưa đặt tên"}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {item.address ? `${item.address}, ` : ""}{item.city || "Việt Nam"}
                          </span>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">ID: {item.id}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* NON-REFUNDABLE STEP 2 (ADVANCED LISTING TABLE AS IN SCREENSHOTS 3 & 4) */
            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-[#1a1a1a]">Chọn các chỗ nghỉ để thay đổi</h3>
              </div>

              {/* Search bar inside Step 2 */}
              <div className="max-w-xl">
                <span className="block text-xs font-bold text-slate-700 mb-1">Tìm chỗ nghỉ</span>
                <div className="relative flex items-center border border-slate-300 rounded-sm focus-within:ring-1 focus-within:ring-[#f60057] focus-within:border-[#f60057]">
                  <input
                    type="text"
                    placeholder="Dán hoặc nhập tên, vị trí hoặc ID chỗ nghỉ (ví dụ ID, có thể nhập cùng lúc)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 font-semibold"
                  />
                  <Search className="absolute right-3 h-5 w-5 text-slate-400" />
                </div>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); toast.success("Đang mở trang hướng dẫn..."); }}
                  className="text-xs text-[#f60057] hover:underline mt-1.5 inline-block font-semibold"
                >
                  Làm sao để dán nhiều ID chỗ nghỉ?
                </a>
              </div>

              {/* Check All Box */}
              {filteredListings.length > 0 && (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-sm border border-slate-150">
                  <input
                    type="checkbox"
                    checked={selectedListings.length === filteredListings.length}
                    onChange={() => {
                      if (selectedListings.length === filteredListings.length) {
                        setSelectedListings([]);
                      } else {
                        setSelectedListings(filteredListings.map(l => l.id));
                      }
                    }}
                    className="h-4.5 w-4.5 accent-[#f60057] rounded-sm cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-500">Chọn tất cả {filteredListings.length} chỗ nghỉ</span>
                </div>
              )}

              {/* Properties list */}
              {filteredListings.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="font-bold text-[15px]">Không tìm thấy chỗ nghỉ nào khớp với tìm kiếm</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredListings.map((item) => {
                    const isChecked = selectedListings.includes(item.id);
                    const rates = listingRates[item.id] || [];
                    const roomType = listingRooms[item.id] || "Căn Hộ 1 Phòng Ngủ";

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col md:flex-row md:items-center justify-between border border-slate-200 rounded-sm p-4 hover:bg-slate-50/50 gap-4"
                      >
                        {/* Left: Info with Checkbox */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleListing(item.id)}
                            className="mt-1 h-5 w-5 accent-[#f60057] rounded-sm cursor-pointer shrink-0"
                          />
                          <div className="flex gap-3">
                            {/* Listing Thumbnail mock */}
                            <div className="h-12 w-12 rounded bg-[#f60057]/5 flex items-center justify-center text-[#f60057] border border-[#f60057]/10 shrink-0 font-bold text-lg">
                              🏠
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 text-[15px] block truncate">{item.name || "Chỗ nghỉ chưa đặt tên"}</span>
                              <span className="text-xs text-slate-500 block">{item.id}</span>
                              <span className="text-[11px] font-bold text-[#f60057] mt-0.5 block">
                                🇻🇳 {item.address ? `${item.address}, ` : ""}{item.city || "Việt Nam"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Dropdowns (Active color updated to `#f60057` borders) */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto relative">
                          
                          {/* Dropdown 1: Đã chọn X loại giá */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenRoomDropdown(null);
                                setOpenRateDropdown(openRateDropdown === item.id ? null : item.id);
                              }}
                              className="inline-flex items-center gap-1 bg-[#f60057]/5 border border-[#f60057] text-[#f60057] font-semibold text-xs py-2 px-3 rounded hover:bg-[#f60057]/10 transition"
                            >
                              <span>{rates.length > 0 ? `Đã chọn ${rates.length} loại giá` : "Chọn loại giá"}</span>
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {openRateDropdown === item.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-60 bg-white border border-slate-200 rounded shadow-lg py-2 px-3 space-y-2 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={rates.includes("Weekly Rate-One Bedroom")}
                                    onChange={() => toggleRateType(item.id, "Weekly Rate-One Bedroom")}
                                    className="accent-[#f60057] h-4 w-4"
                                  />
                                  <span className="font-medium text-slate-700">Weekly Rate-One Bedroom</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={rates.includes("Standard Rate")}
                                    onChange={() => toggleRateType(item.id, "Standard Rate")}
                                    className="accent-[#f60057] h-4 w-4"
                                  />
                                  <span className="font-medium text-slate-700">Standard Rate</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-50">
                                  <input
                                    type="checkbox"
                                    checked={rates.includes("Non-refundable Rate-One Bedroom")}
                                    onChange={() => toggleRateType(item.id, "Non-refundable Rate-One Bedroom")}
                                    className="accent-[#f60057] h-4 w-4"
                                  />
                                  <span className="font-medium text-slate-700">Non-refundable Rate-One Bedroom</span>
                                </label>
                                <div className="border-t border-slate-100 pt-2 flex justify-end">
                                  <button
                                    onClick={() => setOpenRateDropdown(null)}
                                    className="bg-[#f60057] text-white font-bold py-1 px-3 rounded hover:bg-[#f60057]/90 text-[10px]"
                                  >
                                    Hoàn tất
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Dropdown 2: Chọn căn */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenRateDropdown(null);
                                setOpenRoomDropdown(openRoomDropdown === item.id ? null : item.id);
                              }}
                              className="inline-flex items-center gap-1 bg-[#f60057]/5 border border-[#f60057] text-[#f60057] font-semibold text-xs py-2 px-3 rounded hover:bg-[#f60057]/10 transition"
                            >
                              <span>{roomType}</span>
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {openRoomDropdown === item.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-slate-200 rounded shadow-lg py-1 text-xs">
                                <button
                                  onClick={() => selectRoomType(item.id, "Căn Hộ 1 Phòng Ngủ")}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 font-medium text-slate-700 block"
                                >
                                  Căn Hộ 1 Phòng Ngủ
                                </button>
                                <button
                                  onClick={() => selectRoomType(item.id, "Căn Hộ 2 Phòng Ngủ")}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 font-medium text-slate-700 block"
                                >
                                  Căn Hộ 2 Phòng Ngủ
                                </button>
                                <div className="border-t border-slate-100 pt-1.5 pb-1 flex justify-end px-3">
                                  <button
                                    onClick={() => setOpenRoomDropdown(null)}
                                    className="bg-[#f60057] text-white font-bold py-1 px-3 rounded hover:bg-[#f60057]/90 text-[10px]"
                                  >
                                    Hoàn tất
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons (Color updated to `#f60057`) */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView("dashboard"); setWizardType(null); }}
                className="px-6 py-2.5 rounded-sm border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => setView("step1")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm border border-[#f60057] text-[#f60057] bg-white font-bold hover:bg-[#f60057]/5 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </button>
            </div>
            <button
              disabled={selectedListings.length === 0}
              onClick={() => setView("step3")}
              className="bg-[#f60057] text-white px-8 py-2.5 rounded-sm font-bold hover:bg-[#f60057]/90 transition shadow-sm cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {wizardType === "mobile" ? "Tiếp tục" : "Kiểm tra và xác nhận"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // WIZARD VIEW: STEP 3 (CONFIRMATION)
  // =========================================================================
  if (view === "step3") {
    return (
      <div className="min-h-screen bg-[#f3f3f3]">
        {renderStepperHeader(3)}

        <div className="mx-auto max-w-[1000px] px-6 pb-24 space-y-6">
          
          {wizardType === "mobile" ? (
            /* MOBILE STEP 3 CONFIRM */
            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a] border-b border-slate-100 pb-3 mb-4">
                  Kiểm tra & Xác nhận thông tin chương trình khuyến mãi
                </h3>
                <p className="text-sm text-slate-500">
                  Hãy rà soát lại các thông tin chi tiết dưới đây trước khi bấm kích hoạt chương trình khuyến mãi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded border border-slate-150 text-[14px]">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-bold tracking-wider">Kênh áp dụng</span>
                    <span className="font-bold text-slate-800 text-[15px]">
                      {mobileChannel === "both" ? "Ứng dụng và trang web trên điện thoại" : "Chỉ trong ứng dụng"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-bold tracking-wider">Mức giảm giá</span>
                    <span className="font-black text-xl text-[#f60057]">{mobileDiscount}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-bold tracking-wider">Số lượng chỗ nghỉ áp dụng</span>
                    <span className="font-bold text-slate-800 text-[15px]">
                      {selectedListings.length} / {listings.length} chỗ nghỉ
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase font-bold tracking-wider">Giới hạn thời gian / lưu trú</span>
                    <ul className="list-disc pl-4 text-xs text-slate-600 mt-1 space-y-1">
                      <li>Ngày không áp dụng: {mobileBlackoutDates.length > 0 ? mobileBlackoutDates.join(", ") : "Chưa có"}</li>
                      <li>Độ dài lưu trú: {mobileLengthOfStay}</li>
                      <li>Thời gian đặt trước: {mobileBookingWindow}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* List selected names */}
              <div>
                <h4 className="font-bold text-slate-800 text-[14px] mb-2">Chỗ nghỉ được chọn:</h4>
                <div className="bg-slate-50 rounded border border-slate-150 max-h-36 overflow-y-auto px-4 py-2 text-xs text-slate-700 divide-y divide-slate-100">
                  {listings
                    .filter(l => selectedListings.includes(l.id))
                    .map(l => (
                      <div key={l.id} className="py-2 flex justify-between">
                        <span className="font-semibold">{l.name || "Chưa đặt tên"}</span>
                        <span className="text-slate-400">{l.city || "Việt Nam"}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            /* NON-REFUNDABLE STEP 3 CONFIRM (AS SHOWN IN THE SCREENSHOTS) */
            <div className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a] border-b border-[#f60057]/10 pb-3 mb-2">
                  Kiểm tra và xác nhận
                </h3>
                <p className="text-sm text-slate-500">
                  Khi nhấn &ldquo;Áp dụng thay đổi&rdquo;, Quý vị sẽ áp dụng thay đổi:
                </p>
              </div>

              {/* Detail list structure */}
              <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-sm">
                <div className="grid grid-cols-3 p-4 bg-slate-50/50">
                  <span className="font-bold text-slate-500">Tên loại giá</span>
                  <span className="col-span-2 font-bold text-slate-800">{nrName}</span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-slate-500">Giảm giá</span>
                  <span className="col-span-2 font-bold text-slate-800">Giảm {nrDiscount}% cho giá đã chọn</span>
                </div>
                <div className="grid grid-cols-3 p-4 bg-slate-50/50">
                  <span className="font-bold text-slate-500">Lưu trú tối thiểu</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    {nrMinStay === "no" ? "Không có thời gian lưu trú tối thiểu" : `Tối thiểu ${nrMinStayNights} đêm`}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="font-bold text-slate-500">Có thể đặt phòng</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    {nrWindow === "any" ? "Bất kỳ lúc nào" : `Chỉ đặt trước tối đa ${nrWindowDays} ngày`}
                  </span>
                </div>
              </div>

              {/* Selected Homestays summary */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[#1a1a1a] text-sm">Cho {selectedListings.length} chỗ nghỉ này:</h4>
                <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-48 overflow-y-auto px-4 py-1">
                  {listings
                    .filter(l => selectedListings.includes(l.id))
                    .map(l => {
                      const rates = listingRates[l.id] || [];
                      const roomType = listingRooms[l.id] || "Căn Hộ 1 Phòng Ngủ";
                      return (
                        <div key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-1">
                          <div>
                            <span className="font-bold text-slate-800 block text-[13px]">{l.name || "Chưa đặt tên"}</span>
                            <span className="text-slate-400 block mt-0.5">{l.address ? `${l.address}, ` : ""}{l.city}</span>
                          </div>
                          <div className="text-right sm:text-right">
                            <span className="inline-block bg-[#f60057]/5 border border-[#f60057]/20 text-[#f60057] px-2 py-0.5 rounded font-bold mr-2 text-[10px]">
                              {roomType}
                            </span>
                            <span className="text-slate-500 font-semibold">
                              ({rates.join(", ") || "Chưa chọn giá"})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons (Strict `#f60057` styling) */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => { setView("dashboard"); setWizardType(null); }}
              className="px-6 py-2.5 rounded-sm border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("step2")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm border border-[#f60057] text-[#f60057] bg-white font-bold hover:bg-[#f60057]/5 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </button>
              <button
                onClick={finishWizard}
                className="bg-[#f60057] text-white px-8 py-2.5 rounded-sm font-bold hover:bg-[#f60057]/90 transition shadow-sm cursor-pointer"
              >
                {wizardType === "mobile" ? "Xác nhận & Kích hoạt" : "Áp dụng thay đổi"}
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}
