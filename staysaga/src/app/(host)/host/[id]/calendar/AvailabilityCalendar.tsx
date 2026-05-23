"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, ChevronUp, Lightbulb, X } from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;
const rates = [
  { key: "standard", name: "Standard Rate", multiplier: 1 },
  { key: "nonRefundable", name: "Non-refundable Rate", multiplier: 0.9 },
  { key: "weekly", name: "Weekly Rate", multiplier: 0.85 },
  { key: "monthly", name: "Thuê homestay theo tháng", multiplier: 0.7 },
] as const;

type RateKey = (typeof rates)[number]["key"];
type RatePrices = Record<RateKey, number>;

type BulkSection = "rooms" | "prices" | "status" | "restrictions";

function makeRatePrices(basePrice: number): RatePrices {
  return rates.reduce((result, rate) => {
    result[rate.key] = Math.round(basePrice * rate.multiplier);
    return result;
  }, {} as RatePrices);
}

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN");
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShort(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit" }).format(date);
}

export function AvailabilityCalendar({ propertyName, propertyId }: { propertyName: string; propertyId: string }) {
  const today = useMemo(() => new Date(), []);
  const end = useMemo(() => new Date(today.getTime() + 30 * DAY_MS), [today]);
  const days = useMemo(
    () => Array.from({ length: 31 }, (_, index) => new Date(today.getTime() + index * DAY_MS)),
    [today],
  );
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReviewOpen, setReopenReviewOpen] = useState(false);
  const [reopenSuccessOpen, setReopenSuccessOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "month" | "year">("list");
  const [guestPriceOpen, setGuestPriceOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [hiddenTips, setHiddenTips] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<Record<BulkSection, boolean>>({
    rooms: false,
    prices: false,
    status: true,
    restrictions: false,
  });
  const [roomCount, setRoomCount] = useState(1);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [ratePrices, setRatePrices] = useState<RatePrices>(() => makeRatePrices(400000));
  const [bulkRateKey, setBulkRateKey] = useState<RateKey>("standard");
  const [bulkPrice, setBulkPrice] = useState(400000);
  const [minimumStay, setMinimumStay] = useState(1);
  const [restrictionEnabled, setRestrictionEnabled] = useState(true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const price = ratePrices.standard;

  const rangeLabel = `${formatDate(today)} – ${formatDate(end)}`;
  const statusLabel = status === "open" ? "Đặt được" : "Đã đóng";

  const toggle = (section: BulkSection) =>
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));

  function save(label: string) {
    setSavedMessage(label);
    window.setTimeout(() => setSavedMessage(null), 2200);
  }

  function setAllPricesFromBase(nextBasePrice: number) {
    const normalized = Math.max(0, Number.isFinite(nextBasePrice) ? Math.round(nextBasePrice) : 0);
    setRatePrices(makeRatePrices(normalized));
    setBulkPrice(normalized);
  }

  function setRatePrice(key: RateKey, nextPrice: number) {
    const normalized = Math.max(0, Number.isFinite(nextPrice) ? Math.round(nextPrice) : 0);
    setRatePrices((current) => ({ ...current, [key]: normalized }));
    if (key === "standard") {
      setBulkPrice(normalized);
    }
  }

  function applyBulkPrice() {
    if (bulkRateKey === "standard") {
      setAllPricesFromBase(bulkPrice);
      save("Giá Standard Rate đã được lưu, các loại giá còn lại đã tự cập nhật theo tỷ lệ.");
      return;
    }

    setRatePrice(bulkRateKey, bulkPrice);
    save("Giá đã được áp dụng cho toàn bộ khoảng ngày đã chọn.");
  }

  return (
    <main className="bg-[#f2f2f2]">
      <section className="border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
        Chúng tôi tạm thời vô hiệu hóa chính sách không hoàn tiền và thanh toán trước. Ngay khi mở
        lại các chính sách này, chúng tôi sẽ thông báo cho Quý vị.
      </section>

      <section className="px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Lịch</h1>
          <div className="flex gap-3">
            <select
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as "list" | "month" | "year")}
              className="border border-gray-400 bg-white px-4 py-3"
            >
              <option value="month">Xem theo tháng</option>
              <option value="list">Xem dạng liệt kê</option>
              <option value="year">Xem theo năm</option>
            </select>
            <button
              type="button"
              onClick={() => setTipsOpen(true)}
              className="relative border border-[#f60057] bg-white px-4 py-3 font-bold text-[#f60057]"
            >
              <span className="mr-2">☼</span> Đề xuất
              <span className="ml-3 rounded-sm bg-[#f60057] px-2 py-1 text-white">3</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="border border-gray-400 bg-white px-4 py-3">{rangeLabel}</div>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-[#f60057]" />
            Giá theo số lượng khách
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-[#f60057]" />
            Giới hạn
          </label>
        </div>
      </section>

      {viewMode === "year" ? (
        <YearCalendar today={today} status={status} onSelectMonth={() => setViewMode("month")} />
      ) : viewMode === "month" ? (
        <MonthlyCalendar
          today={today}
          ratePrices={ratePrices}
          status={status}
          onGuestPrice={() => setGuestPriceOpen(true)}
          onPriceChange={setRatePrice}
          onSaveAll={() => save("Giá đã được cập nhật một lần cho toàn bộ ngày đang chọn.")}
        />
      ) : (
      <section className="overflow-x-auto bg-white">
        <div className="min-w-[1480px]">
          <div className="grid grid-cols-[270px_repeat(31,74px)] border-y border-gray-200">
            <div className="bg-white" />
            {days.map((day) => (
              <div key={day.toISOString()} className="border-l border-gray-200 px-2 py-3 text-center text-sm">
                <p className="font-bold">{formatShort(day).split(" ")[0]}</p>
                <p className="text-gray-600">{String(day.getDate()).padStart(2, "0")}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[270px_1fr] border-b border-gray-300">
            <div className="p-4">
              <h2 className="text-xl font-bold">
                Căn Hộ 2 Phòng Ngủ <span className="text-sm font-normal text-gray-600">(Số ID phòng: {propertyId.slice(0, 8)}01)</span>
              </h2>
              <button className="mt-2 text-[#f60057]">Đồng bộ hóa lịch</button>
            </div>
            <div className="flex items-center justify-end p-4">
              <button
                onClick={() => setBulkOpen(true)}
                className="bg-[#f60057] px-5 py-3 font-bold text-white hover:bg-[#d9004c]"
              >
                Chỉnh sửa đồng loạt
              </button>
            </div>
          </div>

          <CalendarRow label="Trạng thái phòng">
            {days.map((day) => (
              <Cell key={day.toISOString()} className={status === "open" ? "bg-emerald-50" : "bg-rose-100"}>
                <span className={`rounded-full px-3 py-1 text-sm ${status === "open" ? "text-emerald-800" : "bg-[#f60057] text-white"}`}>
                  {statusLabel}
                </span>
              </Cell>
            ))}
          </CalendarRow>
          <CalendarRow label="Phòng để bán" subLabel="Chỉnh sửa đồng loạt">
            {days.map((day) => (
              <Cell key={day.toISOString()}>{roomCount}</Cell>
            ))}
          </CalendarRow>
          <CalendarRow label="Số phòng được đặt thực tế">
            {days.map((day) => (
              <Cell key={day.toISOString()}>0</Cell>
            ))}
          </CalendarRow>
          {rates.map((rate) => (
            <CalendarRow key={rate.key} label={rate.name} subLabel="× 5 Chỉnh sửa">
              {days.map((day) => (
                <Cell key={day.toISOString()} className={status === "open" ? "bg-white" : "bg-rose-100"}>
                  <p className="text-gray-500">VND</p>
                  <p>{formatCurrency(ratePrices[rate.key])}</p>
                </Cell>
              ))}
            </CalendarRow>
          ))}
          {restrictionEnabled ? (
            <CalendarRow label="Lưu trú tối thiểu">
              {days.map((day) => (
                <Cell key={day.toISOString()}>{minimumStay} đêm</Cell>
              ))}
            </CalendarRow>
          ) : null}
        </div>
      </section>
      )}

      <button
        type="button"
        onClick={() => setReopenOpen(true)}
        className="fixed right-0 top-80 z-30 flex h-16 w-14 items-center justify-center border border-gray-300 bg-white shadow-lg hover:bg-rose-50"
        aria-label="Chuẩn bị mở lại chỗ nghỉ"
      >
        <span className="relative">
          <Lightbulb className="h-7 w-7" />
          <span className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#f60057] text-xs font-bold text-white">
            1
          </span>
        </span>
      </button>

      <footer className="bg-[#f60057] px-6 py-8 text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-6">
          <span>Giới thiệu về chúng tôi</span>
          <span>Chính sách Bảo mật và Cookie</span>
          <span>Các Câu Hỏi Thường Gặp</span>
          <button className="ml-auto bg-white/15 px-5 py-3 font-bold">Thêm chỗ nghỉ mới</button>
          <button className="bg-white/15 px-5 py-3 font-bold">Chia sẻ góp ý của Quý vị</button>
        </div>
      </footer>

      {bulkOpen ? (
        <div className="fixed inset-0 z-50 bg-black/35">
          <aside className="ml-auto flex h-full w-full max-w-[720px] flex-col bg-[#f2f2f2] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-300 bg-white p-6">
              <h2 className="text-2xl font-bold">Chỉnh sửa đồng loạt</h2>
              <button onClick={() => setBulkOpen(false)} aria-label="Đóng">
                <X className="h-7 w-7" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label>
                  <span className="font-bold">Từ:</span>
                  <input type="date" defaultValue={toDateInput(today)} className="mt-2 w-full border border-gray-400 px-4 py-3" />
                </label>
                <label>
                  <span className="font-bold">Đến và bao gồm:</span>
                  <input type="date" defaultValue={toDateInput(end)} className="mt-2 w-full border border-gray-400 px-4 py-3" />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap gap-4">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                  <label key={day} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#f60057]" />
                    {day}
                  </label>
                ))}
              </div>

              <div className="mt-8 border border-gray-300 bg-white">
                <BulkBlock
                  title="Phòng để bán"
                  description="Cập nhật số lượng phòng để bán cho loại phòng này"
                  open={openSections.rooms}
                  onToggle={() => toggle("rooms")}
                >
                  <div className="flex max-w-xs border border-gray-400">
                    <input
                      type="number"
                      min={0}
                      value={roomCount}
                      onChange={(event) => setRoomCount(Number(event.target.value))}
                      className="w-full px-4 py-3 outline-none"
                    />
                    <span className="border-l border-gray-300 px-4 py-3">Phòng</span>
                  </div>
                  <SaveRow onSave={() => save("Số phòng để bán đã được lưu.")} />
                </BulkBlock>

                <BulkBlock
                  title="Giá"
                  description="Thay đổi giá của bất cứ loại giá nào cho phòng này"
                  open={openSections.prices}
                  onToggle={() => toggle("prices")}
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                    <select
                      value={bulkRateKey}
                      onChange={(event) => {
                        const nextKey = event.target.value as RateKey;
                        setBulkRateKey(nextKey);
                        setBulkPrice(ratePrices[nextKey]);
                      }}
                      className="border border-gray-400 px-4 py-3"
                    >
                      {rates.map((rate) => (
                        <option key={rate.key} value={rate.key}>
                          {rate.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex border border-gray-400">
                      <input
                        type="number"
                        value={bulkPrice}
                        onChange={(event) => setBulkPrice(Number(event.target.value))}
                        className="w-full px-4 py-3 outline-none"
                      />
                      <span className="border-l border-gray-300 px-4 py-3">VND</span>
                    </label>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Chọn Standard Rate để cập nhật một lần cho tất cả loại giá theo tỷ lệ hiện tại. Chọn từng loại giá nếu chỉ muốn sửa riêng giá đó.
                  </p>
                  <SaveRow onSave={applyBulkPrice} />
                </BulkBlock>

                <BulkBlock
                  title="Trạng thái phòng"
                  description="Mở hoặc đóng phòng này"
                  open={openSections.status}
                  onToggle={() => toggle("status")}
                >
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="status"
                        checked={status === "open"}
                        onChange={() => setStatus("open")}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Mở phòng
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="status"
                        checked={status === "closed"}
                        onChange={() => setStatus("closed")}
                        className="h-5 w-5 accent-[#f60057]"
                      />
                      Đóng phòng
                    </label>
                  </div>
                  <p className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    Chú ý: Loại phòng này có các giới hạn dành cho loại giá trong khoảng ngày Quý vị đã chọn.
                    Các giới hạn có thể ngăn không cho khách đặt phòng.
                  </p>
                  <SaveRow onSave={() => save("Trạng thái phòng đã được lưu.")} />
                </BulkBlock>

                <BulkBlock
                  title="Giới hạn"
                  description="Chỉnh sửa, thêm hoặc xóa giới hạn cho bất kỳ loại giá nào cho phòng này"
                  open={openSections.restrictions}
                  onToggle={() => toggle("restrictions")}
                >
                  <div className="grid gap-3">
                    <select className="border border-gray-400 px-4 py-3">
                      <option>Standard Rate</option>
                      <option>Non-refundable Rate</option>
                    </select>
                    <select className="border border-gray-400 px-4 py-3">
                      <option>Thời gian lưu trú tối thiểu</option>
                      <option>Không nhận phòng</option>
                      <option>Không trả phòng</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={minimumStay}
                      onChange={(event) => setMinimumStay(Number(event.target.value))}
                      className="border border-gray-400 px-4 py-3"
                    />
                    <span>đêm</span>
                    <div className="flex gap-5">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={restrictionEnabled}
                          onChange={() => setRestrictionEnabled(true)}
                          className="h-5 w-5 accent-[#f60057]"
                        />
                        Kích hoạt
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!restrictionEnabled}
                          onChange={() => setRestrictionEnabled(false)}
                          className="h-5 w-5 accent-[#f60057]"
                        />
                        Xóa
                      </label>
                    </div>
                  </div>
                  <button className="mt-4 text-[#f60057]" type="button">+ Thêm phòng</button>
                  <SaveRow onSave={() => save("Giới hạn đã được lưu.")} />
                </BulkBlock>
              </div>

              <p className="mt-5 text-sm text-gray-600">Thay đổi sẽ được thực hiện cho khoảng thời gian: {rangeLabel}</p>
              {savedMessage ? (
                <div className="mt-5 border border-emerald-400 bg-emerald-50 px-5 py-4 font-bold text-emerald-800">
                  {savedMessage}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {reopenOpen ? (
        <ReopenModal
          startDate={today}
          endDate={end}
          onClose={() => setReopenOpen(false)}
          onPreview={() => {
            setReopenOpen(false);
            setReopenReviewOpen(true);
          }}
        />
      ) : null}

      {reopenReviewOpen ? (
        <ReopenReviewModal
          startDate={today}
          onClose={() => setReopenReviewOpen(false)}
          onBack={() => {
            setReopenReviewOpen(false);
            setReopenOpen(true);
          }}
          onConfirm={() => {
            setStatus("open");
            setReopenReviewOpen(false);
            setReopenSuccessOpen(true);
          }}
        />
      ) : null}

      {reopenSuccessOpen ? (
        <SimpleModal
          title="Giờ đây chỗ nghỉ đã được hiển thị với khách"
          description="Chỗ nghỉ của Quý vị đã được mở. Khách có thể thấy và đặt chỗ nghỉ trở lại."
          action="Đóng"
          onClose={() => {
            setReopenSuccessOpen(false);
            save("Chỗ nghỉ đã được mở lại và hiển thị với khách.");
          }}
        />
      ) : null}

      {guestPriceOpen ? <GuestPriceModal price={price} onClose={() => setGuestPriceOpen(false)} /> : null}

      {tipsOpen ? (
        <TipsDrawer
          propertyId={propertyId}
          hiddenTips={hiddenTips}
          onHide={(tip) => setHiddenTips((current) => [...current, tip])}
          onClose={() => setTipsOpen(false)}
        />
      ) : null}
    </main>
  );
}

function TipsDrawer({
  propertyId,
  hiddenTips,
  onHide,
  onClose,
}: {
  propertyId: string;
  hiddenTips: string[];
  onHide: (tip: string) => void;
  onClose: () => void;
}) {
  const tips = [
    {
      id: "monthly",
      title: "Đón đầu xu hướng du lịch đang lên với giá theo tháng",
      body: "Xu hướng lưu trú dài ngày đang nở rộ. Hãy chuẩn bị cho chỗ nghỉ với loại giá theo tháng.",
      action: "Thêm loại giá theo tháng",
      href: `/host/${propertyId}/calendar/rate-advisor`,
    },
    {
      id: "promo",
      title: "Nhận điểm đánh giá sớm hơn bằng cách thiết lập khuyến mãi",
      body: "Việc sử dụng khuyến mãi để áp dụng mức điều chỉnh giá 20% có thể thu hút được nhiều đặt phòng hơn.",
      action: "Thiết lập khuyến mãi",
      href: `/host/${propertyId}/promotions`,
    },
    {
      id: "shortstay",
      title: "Tăng doanh thu với những kỳ lưu trú ngắn hơn!",
      body: "Hầu hết khách hàng thích nghỉ từ 2 đêm trở xuống. Nhận thêm đặt phòng bằng thời gian lưu trú tối thiểu ngắn hơn.",
      action: null,
      href: "#",
    },
  ].filter((tip) => !hiddenTips.includes(tip.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/55">
      <aside className="ml-auto h-full w-full max-w-[590px] overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Mẹo hay dành cho Quý vị</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-7 w-7 text-gray-500" />
          </button>
        </div>
        <div className="mt-5 space-y-6">
          {tips.map((tip) => (
            <article key={tip.id} className="border border-rose-200 p-6">
              <div className="flex items-start gap-4">
                <div>
                  <h3 className="text-xl font-bold">{tip.title}</h3>
                  <p className="mt-4 text-gray-700">{tip.body}</p>
                  {tip.action ? (
                    <Link
                      href={tip.href}
                      className="mt-5 inline-flex border border-[#f60057] px-5 py-3 font-bold text-[#f60057]"
                    >
                      {tip.action}
                    </Link>
                  ) : null}
                </div>
                <button type="button" onClick={() => onHide(tip.id)} className="ml-auto" aria-label="Ẩn mẹo">
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ReopenModal({
  startDate,
  endDate,
  onClose,
  onPreview,
}: {
  startDate: Date;
  endDate: Date;
  onClose: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-4 py-8">
      <section className="w-full max-w-[720px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-6 p-6">
          <div>
            <h2 className="text-2xl font-bold">Chuẩn bị sẵn sàng để mở lại chỗ nghỉ</h2>
            <p className="mt-3 text-gray-700">
              Hãy thiết lập tất cả thông tin mở lại chỗ nghỉ ngay từ bây giờ để giảm bớt phiền hà
              sau này. Chúng tôi sẽ nhắc Quý vị trước khi chỗ nghỉ được mở lại.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-7 w-7" />
          </button>
        </div>

        <div className="space-y-8 px-10 pb-8">
          <section>
            <h3 className="text-xl font-bold">1. Khi nào khách có thể lưu trú tại chỗ nghỉ?</h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <DateBox label="Từ *" value={startDate} />
              <DateBox label="Đến hết *" value={endDate} />
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold">2. Khi nào khách có thể bắt đầu đặt phòng tại chỗ nghỉ?</h3>
            <label className="mt-4 flex items-center gap-3">
              <input type="radio" defaultChecked className="h-6 w-6 accent-[#f60057]" />
              Ngay bây giờ
            </label>
          </section>

          <section>
            <h3 className="text-xl font-bold">3. Quý vị muốn thu mức giá bao nhiêu khi mở lại chỗ nghỉ?</h3>
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_188px]">
              <select className="border border-gray-400 px-4 py-3">
                <option>Tăng theo phần trăm</option>
                <option>Giữ nguyên giá hiện tại</option>
                <option>Giảm theo phần trăm</option>
              </select>
              <input type="number" defaultValue={10} className="border border-gray-400 px-4 py-3" />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Trước đây, Quý vị đã cài giá cho khoảng thời gian tương tự. Khi mở lại chỗ nghỉ hôm
              nay, giá này sẽ được áp dụng cùng với mức tăng 10%. Vui lòng kiểm tra lịch để biết giá
              sau cùng.
            </p>
          </section>

          <button type="button" onClick={onPreview} className="bg-[#f60057] px-5 py-3 font-bold text-white">
            Xem lại
          </button>
        </div>
      </section>
    </div>
  );
}

function DateBox({ label, value }: { label: string; value: Date }) {
  return (
    <label>
      <span className="font-medium">{label}</span>
      <span className="mt-2 flex items-center gap-3 border border-gray-400 px-4 py-3">
        <CalendarDays className="h-5 w-5 text-gray-600" />
        {formatDate(value)}
      </span>
    </label>
  );
}

function ReopenReviewModal({
  startDate,
  onClose,
  onBack,
  onConfirm,
}: {
  startDate: Date;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-4 py-10">
      <section className="w-full max-w-[720px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-6 p-6">
          <div>
            <h2 className="text-2xl font-bold">Xem lại và xác nhận chi tiết</h2>
            <p className="mt-3 text-gray-700">
              Vui lòng kiểm tra các lựa chọn bên dưới. Chỗ nghỉ của Quý vị sẽ được hiển thị trở lại
              ngay và khách sẽ thấy các mức giá mà trước đây Quý vị đã áp dụng cho cùng khoảng thời
              gian, cộng thêm 10%.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-7 w-7" />
          </button>
        </div>
        <div className="px-6 pb-6">
          <div className="grid gap-5 border-y border-gray-200 py-6 md:grid-cols-3">
            <ReviewFact label="Hiển thị từ" value="Ngay bây giờ" />
            <ReviewFact label="Nhận phòng từ" value={formatDate(startDate)} />
            <ReviewFact label="Giá" value="Tăng 10%" />
          </div>
          <div className="mt-6 flex gap-4 border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <Lightbulb className="h-6 w-6 shrink-0" />
            <p>Cài đặt này chỉ áp dụng cho các phòng/căn mà Quý vị đã đăng ký khi thiết lập chỗ nghỉ trên hệ thống của chúng tôi.</p>
          </div>
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={onConfirm} className="bg-[#f60057] px-5 py-3 font-bold text-white">
              Xác nhận
            </button>
            <button type="button" onClick={onBack} className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
              Quay lại
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-gray-200 md:border-r md:last:border-r-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function SimpleModal({
  title,
  description,
  action,
  onClose,
}: {
  title: string;
  description: string;
  action: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-4 py-16">
      <section className="w-full max-w-[720px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-3 text-gray-700">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-7 w-7" />
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-6 bg-[#f60057] px-5 py-3 font-bold text-white">
          {action}
        </button>
      </section>
    </div>
  );
}

function GuestPriceModal({ price, onClose }: { price: number; onClose: () => void }) {
  const tiers = [5, 4, 3, 2, 1];
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 px-4 py-8">
      <section className="max-h-[88vh] w-full max-w-[720px] overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-bold">Đặt các mức giá khác nhau cho các nhóm khách khác nhau</h2>
            <p className="mt-3">Standard Rate</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-7 w-7" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700">
            Giá của Quý vị có thể thay đổi tùy vào số lượng khách lưu trú tại chỗ nghỉ. Quý vị có
            thể cài đặt mức giảm giá cố định cho từng nhóm khách.
          </p>
          <div className="mt-5 flex gap-6">
            <label className="flex items-center gap-2">
              <input type="radio" className="h-5 w-5 accent-[#f60057]" /> Được đề xuất
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" defaultChecked className="h-5 w-5 accent-[#f60057]" /> Tùy chọn
            </label>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1.4fr] border-t border-gray-200">
          <div className="p-5 font-bold">Sức chứa</div>
          <div className="p-5 font-bold">Giá</div>
          {tiers.map((guest, index) => (
            <div key={guest} className="contents">
              <div className="border-t border-gray-200 p-5">
                <p>{guest} khách</p>
                {index === 0 ? <button className="mt-1 text-[#f60057]">Chỉnh sửa số lượng khách tiêu chuẩn</button> : null}
              </div>
              <div className="border-t border-gray-200 p-5">
                {index === 0 ? (
                  <p>Giá thông thường</p>
                ) : (
                  <div className="grid gap-2">
                    <label className="flex items-center justify-between">
                      <span>Giảm thêm trên giá thông thường</span>
                      <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#f60057]" />
                    </label>
                    <div className="flex w-48 border border-gray-300">
                      <input defaultValue={10} className="w-full px-3 py-2" />
                      <span className="border-l border-gray-300 px-3 py-2">%</span>
                    </div>
                    <p className="text-sm text-gray-600">VND {Math.round(price * (1 - index * 0.05)).toLocaleString("vi-VN")}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-t border-gray-200 p-6">
          <button className="bg-[#f60057] px-5 py-3 font-bold text-white" onClick={onClose}>Lưu</button>
          <button className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]" onClick={onClose}>Hủy</button>
        </div>
      </section>
    </div>
  );
}

function MonthlyCalendar({
  today,
  ratePrices,
  status,
  onGuestPrice,
  onPriceChange,
  onSaveAll,
}: {
  today: Date;
  ratePrices: RatePrices;
  status: "open" | "closed";
  onGuestPrice: () => void;
  onPriceChange: (key: RateKey, value: number) => void;
  onSaveAll: () => void;
}) {
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="grid gap-5 px-5 pb-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-5 flex items-center gap-3">
          <button className="border border-[#f60057] px-5 py-3 text-[#f60057]">‹</button>
          <button className="border border-[#f60057] px-5 py-3 text-[#f60057]">›</button>
          <strong className="ml-2 text-xl">tháng {today.getMonth() + 1}/{today.getFullYear()}</strong>
        </div>
        <div className="grid grid-cols-7 border border-gray-300 bg-white">
          {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map((day) => (
            <div key={day} className="border-b border-r border-gray-200 p-3 font-medium">
              {day}
            </div>
          ))}
          {cells.map((day, index) => (
            <button
              key={`${day ?? "empty"}-${index}`}
              type="button"
              className={`min-h-32 border-b border-r border-gray-200 p-3 text-left ${
                day === today.getDate() ? "bg-rose-50 ring-2 ring-[#f60057]" : "bg-white"
              }`}
            >
              {day ? (
                <>
                  <p className="font-bold">{day}</p>
                  <p className={`mt-6 text-sm ${status === "open" ? "text-emerald-700" : "text-[#f60057]"}`}>
                    {status === "open" ? "Mở bán" : "Đóng"}
                  </p>
                  <p className="mt-3">VND {formatCurrency(ratePrices.standard)}</p>
                </>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <aside className="border border-gray-300 bg-white p-5">
        <h2 className="text-xl font-bold">Đã chọn 1 ngày</h2>
        <label className="mt-4 block">
          <span>Ngày bắt đầu</span>
          <span className="mt-2 block border border-gray-300 px-4 py-3">{formatDate(today)}</span>
        </label>
        <label className="mt-4 block">
          <span>Ngày kết thúc</span>
          <span className="mt-2 block border border-gray-300 px-4 py-3">{formatDate(today)}</span>
        </label>
        <div className="mt-6 border-t border-gray-200 pt-5">
          <p className="font-bold">Mở hoặc đóng nhận đặt phòng</p>
          <div className="mt-3 flex gap-5">
            <label className="flex items-center gap-2"><input type="radio" defaultChecked className="h-5 w-5 accent-[#f60057]" /> Mở</label>
            <label className="flex items-center gap-2"><input type="radio" className="h-5 w-5 accent-[#f60057]" /> Đóng</label>
          </div>
        </div>
        <div className="mt-5 border-t border-gray-200 pt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">Giá</p>
            <button type="button" onClick={onSaveAll} className="bg-[#f60057] px-4 py-2 font-bold text-white">
              Lưu tất cả giá
            </button>
          </div>
          <div className="mt-3 space-y-5">
            {rates.map((rate) => (
              <div key={rate.key} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                <p className="text-gray-600">{rate.name}</p>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" defaultChecked className="h-5 w-5 accent-[#f60057]" /> Mở
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" className="h-5 w-5 accent-[#f60057]" /> Đóng
                  </label>
                </div>
                <div className="mt-2 flex">
                  <span className="border border-gray-300 px-4 py-3">VND</span>
                  <input
                    type="number"
                    value={ratePrices[rate.key]}
                    onChange={(event) => onPriceChange(rate.key, Number(event.target.value))}
                    className="w-full border-y border-gray-300 px-3"
                  />
                  <button type="button" onClick={onGuestPrice} className="border border-[#f60057] px-4 text-[#f60057]">
                    5
                  </button>
                </div>
                <button className="mt-2 text-[#f60057]">Giới hạn</button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );
}

function YearCalendar({
  today,
  status,
  onSelectMonth,
}: {
  today: Date;
  status: "open" | "closed";
  onSelectMonth: () => void;
}) {
  const months = Array.from({ length: 12 }, (_, index) => new Date(today.getFullYear(), today.getMonth() + index, 1));

  return (
    <section className="bg-white px-5 pb-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select className="border border-gray-400 bg-white px-4 py-3">
          <option>12 tháng tới</option>
        </select>
        <div className="flex rounded-full border border-gray-300 bg-white">
          <button className="rounded-full bg-white px-4 py-2 shadow">Tất cả các ngày</button>
          <button className="px-4 py-2 text-gray-600">Ngày có thể đặt phòng</button>
          <button className="px-4 py-2 text-gray-600">Ngày đã bán hết phòng</button>
        </div>
      </div>
      <div className="grid gap-x-7 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
        {months.map((month, monthIndex) => {
          const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
          const leading = (month.getDay() + 6) % 7;
          const isOpenMonth = status === "open" && monthIndex < 2;
          return (
            <button key={month.toISOString()} type="button" onClick={onSelectMonth} className="text-left">
              <h2 className="mb-4 text-xl font-medium text-[#f60057]">
                Tháng {month.getMonth() + 1} {month.getFullYear()}
              </h2>
              <div className="grid grid-cols-7 text-center text-sm">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                  <div key={day} className="py-2 text-gray-600">
                    {day}
                  </div>
                ))}
                {Array.from({ length: leading }, (_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const isToday = month.getMonth() === today.getMonth() && day === today.getDate();
                  return (
                    <div
                      key={day}
                      className={`py-2 ${
                        isOpenMonth
                          ? "bg-emerald-50 font-semibold"
                          : "bg-[repeating-linear-gradient(45deg,#fecdd3_0,#fecdd3_4px,#fda4af_4px,#fda4af_8px)]"
                      } ${isToday ? "ring-2 ring-[#f60057]" : ""}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CalendarRow({ label, subLabel, children }: { label: string; subLabel?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[270px_repeat(31,74px)] border-b border-gray-200">
      <div className="border-r border-gray-200 bg-[#f7f7f7] p-3">
        <p>{label}</p>
        {subLabel ? <button className="mt-1 text-sm text-[#f60057]">{subLabel}</button> : null}
      </div>
      {children}
    </div>
  );
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-12 border-l border-gray-200 p-2 text-center text-sm ${className}`}>{children}</div>;
}

function BulkBlock({
  title,
  description,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-gray-200 last:border-b-0">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left">
        <span>
          <strong className="block text-xl">{title}</strong>
          <span className="text-gray-600">{description}</span>
        </span>
        {open ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
      </button>
      {open ? <div className="px-5 pb-6">{children}</div> : null}
    </section>
  );
}

function SaveRow({ onSave }: { onSave: () => void }) {
  return (
    <div className="mt-5 flex gap-3">
      <button type="button" onClick={onSave} className="bg-[#f60057] px-5 py-3 font-bold text-white">
        Lưu thay đổi
      </button>
      <button type="button" className="border border-[#f60057] px-5 py-3 font-bold text-[#f60057]">
        Hủy
      </button>
    </div>
  );
}
