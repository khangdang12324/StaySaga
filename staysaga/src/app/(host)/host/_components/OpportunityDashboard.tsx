"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

type ListingItem = {
  id: string;
  name: string;
};

type OpportunityDashboardProps = {
  initialListings: ListingItem[];
};

const filterTopics = [
  { id: "room", label: "Phòng trống" },
  { id: "rank", label: "Xếp hạng" },
  { id: "views", label: "Lượt xem trang" },
  { id: "conversion", label: "Tỷ lệ chuyển đổi" },
  { id: "stay", label: "Thời gian lưu trú" },
  { id: "adr", label: "Giá trung bình hằng ngày" },
  { id: "cancel", label: "Hủy đặt phòng" },
  { id: "workload", label: "Giảm lượng công việc" },
  { id: "all", label: "Tất cả chủ đề" },
];

export function OpportunityDashboard({ initialListings }: OpportunityDashboardProps) {
  const [selectedTopic, setSelectedTopic] = useState("room");
  const [showIntroBanner, setShowIntroBanner] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<"infant" | "family" | "reopen" | null>(null);

  // Keep track of which actions have been clicked / configured
  const [setupStates, setSetupStates] = useState<Record<string, boolean>>({});

  // Localized property data that fits the screenshots, fallback to actual properties if available
  const propertiesForInfant = initialListings.length >= 2 
    ? initialListings.slice(0, 2)
    : [
        { id: "16468959", name: "Khang home" },
        { id: "14041228", name: "Gôn Home" }
      ];

  const propertiesForFamily = initialListings.length >= 1 
    ? [initialListings[0]]
    : [{ id: "14041228", name: "Gôn Home" }];

  const propertiesForReopen = initialListings.length >= 1 
    ? [initialListings[0]]
    : [{ id: "14041228", name: "Gôn Home" }];

  const handleActionClick = (opportunityKey: string, propertyName: string) => {
    const stateKey = `${opportunityKey}-${propertyName}`;
    if (setupStates[stateKey]) {
      toast.error(`Đã thiết lập cơ hội này cho ${propertyName} trước đó.`);
      return;
    }

    setSetupStates(prev => ({ ...prev, [stateKey]: true }));
    toast.success(`Cập nhật thành công cho ${propertyName}!`);
  };

  // If a detail view is selected, render the corresponding detail page
  if (selectedOpportunity === "infant") {
    return (
      <div className="mt-6">
        <button
          onClick={() => setSelectedOpportunity(null)}
          className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#f60057] transition cursor-pointer"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Quay lại Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900">Miễn phí lưu trú cho trẻ sơ sinh</h1>
        <p className="mt-2 text-sm text-slate-600">
          Việc này sẽ khiến Quý vị khó tiếp cận khách gia đình hơn.
        </p>

        <div className="mt-6 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="px-6 py-4">Chỗ nghỉ</th>
                <th className="px-6 py-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {propertiesForInfant.map((prop) => {
                const stateKey = `infant-${prop.name}`;
                const isDone = setupStates[stateKey];
                return (
                  <tr key={prop.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-red-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{prop.name}</p>
                          <p className="text-xs text-slate-500">{prop.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleActionClick("infant", prop.name)}
                        className={`inline-flex items-center gap-1.5 font-semibold text-sm transition cursor-pointer ${
                          isDone 
                            ? "text-slate-400 cursor-not-allowed" 
                            : "text-[#f60057] hover:text-[#d8004f] hover:underline"
                        }`}
                        disabled={isDone}
                      >
                        <span>{isDone ? "Đã thiết lập" : "Cho trẻ sơ sinh lưu trú miễn phí"}</span>
                        {!isDone && <ExternalLink size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination bar mimicking Booking.com */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
                &lt;
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded border border-[#f60057] bg-rose-50 font-bold text-[#f60057]">
                1
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
                &gt;
              </button>
            </div>
            <div>
              <span>1-2 / 2 chỗ nghỉ</span>
            </div>
            <div>
              <select className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none">
                <option>Hiển thị 30 chỗ nghỉ</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedOpportunity === "family") {
    return (
      <div className="mt-6">
        <button
          onClick={() => setSelectedOpportunity(null)}
          className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#f60057] transition cursor-pointer"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Quay lại Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900">Tăng lượng đặt phòng từ khách gia đình lên tới 15%</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Gia đình là phân khúc khách quan trọng của các chỗ nghỉ. Với giá dành cho trẻ em, Quý vị có thể đảm bảo chỗ nghỉ phù hợp với các nhu cầu đặc biệt từ khách gia đình, qua đó thu hút nhóm khách này nhiều hơn.
        </p>

        <div className="mt-6 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="px-6 py-4">Chỗ nghỉ</th>
                <th className="px-6 py-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {propertiesForFamily.map((prop) => {
                const stateKey = `family-${prop.name}`;
                const isDone = setupStates[stateKey];
                return (
                  <tr key={prop.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-red-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{prop.name}</p>
                          <p className="text-xs text-slate-500">{prop.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleActionClick("family", prop.name)}
                        className={`inline-flex items-center gap-1.5 font-semibold text-sm transition cursor-pointer ${
                          isDone 
                            ? "text-slate-400 cursor-not-allowed" 
                            : "text-[#f60057] hover:text-[#d8004f] hover:underline"
                        }`}
                        disabled={isDone}
                      >
                        <span>{isDone ? "Đã thiết lập" : "Thu hút thêm khách với giá dành cho trẻ em"}</span>
                        {!isDone && <ExternalLink size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
                &lt;
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded border border-[#f60057] bg-rose-50 font-bold text-[#f60057]">
                1
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
                &gt;
              </button>
            </div>
            <div>
              <span>1-1 / 1 chỗ nghỉ</span>
            </div>
            <div>
              <select className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none">
                <option>Hiển thị 30 chỗ nghỉ</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedOpportunity === "reopen") {
    return (
      <div className="mt-6">
        <button
          onClick={() => setSelectedOpportunity(null)}
          className="group mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#f60057] transition cursor-pointer"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Quay lại Trung tâm Cơ hội dành cho Nhóm chỗ nghỉ</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900">Thiết lập kế hoạch mở lại chỗ nghỉ</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Hãy đảm bảo chỗ nghỉ của Quý vị có phòng trống để khách đặt khi mùa tiếp theo đến gần. Việc khách có thể đặt chỗ nghỉ của Quý vị trước bao lâu là tùy thuộc vào Quý vị. Nếu không chắc chắn về giá, Quý vị có thể điều chỉnh sau.
        </p>

        <div className="mt-6 overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-slate-800">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="px-6 py-4">Chỗ nghỉ</th>
                <th className="px-6 py-4">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {propertiesForReopen.map((prop) => {
                const stateKey = `reopen-${prop.name}`;
                const isDone = setupStates[stateKey];
                return (
                  <tr key={prop.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-red-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{prop.name}</p>
                          <p className="text-xs text-slate-500">{prop.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleActionClick("reopen", prop.name)}
                        className={`inline-flex items-center gap-1.5 font-semibold text-sm transition cursor-pointer ${
                          isDone 
                            ? "text-slate-400 cursor-not-allowed" 
                            : "text-[#f60057] hover:text-[#d8004f] hover:underline"
                        }`}
                        disabled={isDone}
                      >
                        <span>{isDone ? "Đã thiết lập" : "Thiết lập ngay"}</span>
                        {!isDone && <ExternalLink size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
                &lt;
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded border border-[#f60057] bg-rose-50 font-bold text-[#f60057]">
                1
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed">
                &gt;
              </button>
            </div>
            <div>
              <span>1-1 / 1 chỗ nghỉ</span>
            </div>
            <div>
              <select className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none">
                <option>Hiển thị 30 chỗ nghỉ</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Filter Sidebar */}
      <div className="lg:col-span-1">
        <div className="rounded-sm border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <h2 className="font-bold text-slate-800">Hiệu quả hoạt động</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Nhấp vào chủ đề để tìm lời khuyên về cách duy trì sức cạnh tranh. Những chủ đề này được đề xuất dựa trên hiệu suất hoạt động của Quý vị trong 30 ngày qua so với những chỗ nghỉ tương tự trong khu vực.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {filterTopics.map((topic) => {
              const isSelected = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-sm transition cursor-pointer ${
                    isSelected
                      ? "border-l-4 border-l-[#f60057] bg-rose-50/50 font-bold text-[#f60057]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-[#f60057]" : "bg-slate-300"}`} />
                    <span>{topic.label}</span>
                  </div>
                  <ChevronRight size={16} className={isSelected ? "text-[#f60057]" : "text-slate-400"} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Opportunities List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Intro Explainer Banner */}
        {showIntroBanner && (
          <div className="relative rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <button
              onClick={() => setShowIntroBanner(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Đóng giới thiệu"
            >
              <X size={18} />
            </button>
            <h3 className="pr-8 text-base font-bold text-slate-900">
              Giới thiệu cách mới để theo dõi hiệu suất hoạt động của chỗ nghỉ
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Xem tương quan nhóm chỗ nghỉ của Quý vị với các chỗ nghỉ tương tự và tìm những cơ hội tốt nhất để cải thiện hiệu quả kinh doanh.
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" />
                <span>Một số chỗ nghỉ của Quý vị đang hoạt động kém hiệu quả hơn so với nhóm đối thủ cạnh tranh</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-500" />
                <span>Các chỗ nghỉ của Quý vị đang hoạt động hiệu quả tương đương với nhóm đối thủ cạnh tranh</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <span>Các chỗ nghỉ của Quý vị đang hoạt động hiệu quả hơn một chút so với nhóm đối thủ cạnh tranh</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-800" />
                <span>Các chỗ nghỉ của Quý vị đang dẫn trước nhóm đối thủ cạnh tranh</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
                <span>Các cơ hội cải thiện phương thức làm việc</span>
              </li>
            </ul>

            <button
              onClick={() => setShowIntroBanner(false)}
              className="mt-6 rounded border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer focus:outline-none"
            >
              Tôi đã hiểu
            </button>
          </div>
        )}

        {/* Opportunity Items List */}
        <div className="space-y-6">
          {/* Card 1: Infant Rate */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f60057]">
              <span>Miễn phí lưu trú cho trẻ sơ sinh ({propertiesForInfant.length} chỗ nghỉ)</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Quý vị đã không tính trẻ sơ sinh trong số khách tối đa để tiếp cận nhiều khách gia đình hơn. Hãy thêm giá dành cho trẻ sơ sinh để hoàn tất quy trình thiết lập.
            </p>
            <button
              onClick={() => setSelectedOpportunity("infant")}
              className="mt-5 rounded border border-[#f60057] bg-white px-5 py-2 text-sm font-semibold text-[#f60057] hover:bg-rose-50 transition cursor-pointer focus:outline-none"
            >
              Xem {propertiesForInfant.length} chỗ nghỉ
            </button>
          </div>

          {/* Card 2: Family Rate */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f60057]">
              <span>Tăng lượng đặt phòng từ khách gia đình lên tới 15% ({propertiesForFamily.length} chỗ nghỉ)</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Gia đình là phân khúc khách quan trọng của các chỗ nghỉ. Với giá dành cho trẻ em, Quý vị có thể đảm bảo chỗ nghỉ phù hợp với các nhu cầu đặc biệt từ khách gia đình, qua đó thu hút nhóm khách này nhiều hơn.
            </p>
            <button
              onClick={() => setSelectedOpportunity("family")}
              className="mt-5 rounded border border-[#f60057] bg-white px-5 py-2 text-sm font-semibold text-[#f60057] hover:bg-rose-50 transition cursor-pointer focus:outline-none"
            >
              Xem {propertiesForFamily.length} chỗ nghỉ
            </button>
          </div>

          {/* Card 3: Reopen Plan */}
          <div className="rounded-sm border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#f60057]">
              <span>Thiết lập kế hoạch mở lại chỗ nghỉ ({propertiesForReopen.length} chỗ nghỉ)</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Hãy đảm bảo chỗ nghỉ của Quý vị có phòng trống để khách đặt khi mùa tiếp theo đến gần. Việc khách có thể đặt chỗ nghỉ của Quý vị trước bao lâu là tùy thuộc vào Quý vị. Nếu không chắc chắn về giá, Quý vị có thể điều chỉnh sau.
            </p>
            <button
              onClick={() => setSelectedOpportunity("reopen")}
              className="mt-5 rounded border border-[#f60057] bg-white px-5 py-2 text-sm font-semibold text-[#f60057] hover:bg-rose-50 transition cursor-pointer focus:outline-none"
            >
              Xem {propertiesForReopen.length} chỗ nghỉ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
