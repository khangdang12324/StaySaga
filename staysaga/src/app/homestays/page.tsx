import { Star, MapPin, Filter } from "lucide-react";
import Link from "next/link";
import { getProperties } from "@/core/properties/actions";
import { getFavoriteIds } from "@/core/favorites/actions";
import FavoriteButton from "@/components/features/favorites/FavoriteButton";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2000";

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi miễn phí",
  parking: "Bãi đỗ xe",
  kitchen: "Bếp riêng",
  pool: "Hồ bơi",
  bbq: "BBQ",
  garden: "Sân vườn",
  gym: "Phòng gym",
  beach: "Gần biển",
  mountain_view: "View núi",
  ac: "Điều hòa",
  breakfast: "Bữa sáng",
  balcony: "Ban công",
  lake_view: "View hồ",
};

const POLICY_LABELS: Record<string, string> = {
  free_cancellation: "Miễn phí hủy",
  pay_at_hotel: "Thanh toán tại khách sạn",
  no_credit_card: "Không cần thẻ tín dụng",
  breakfast: "Bao gồm bữa sáng",
};

const TYPE_OPTIONS = [
  { value: "hotel", label: "Khách sạn" },
  { value: "apartment", label: "Căn hộ" },
  { value: "homestay", label: "Homestay" },
  { value: "villa", label: "Biệt thự" },
  { value: "resort", label: "Resort" },
];

const AMENITY_OPTIONS = [
  { value: "pool", label: "Hồ bơi" },
  { value: "gym", label: "Phòng gym" },
  { value: "parking", label: "Bãi đỗ xe" },
  { value: "breakfast", label: "Bữa sáng" },
  { value: "balcony", label: "Ban công" },
  { value: "kitchen", label: "Bếp riêng" },
];

const POPULAR_FILTERS = [
  { value: "free_cancellation", label: "Miễn phí hủy" },
  { value: "pay_at_hotel", label: "Thanh toán tại khách sạn" },
  { value: "no_credit_card", label: "Không cần thẻ tín dụng" },
  { value: "breakfast", label: "Bao gồm bữa sáng" },
];

const DISTANCE_OPTIONS = [
  { value: 1, label: "Dưới 1 km" },
  { value: 3, label: "1 - 3 km" },
  { value: 5, label: "3 - 5 km" },
  { value: 10, label: "Trên 5 km" },
];

const parseNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseArray = (value?: string | string[]) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getSeed = (value: string) =>
  value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);

const getRatingLabel = (rating: number) => {
  if (rating >= 4.8) return "Tuyệt vời";
  if (rating >= 4.5) return "Rất tốt";
  return "Tốt";
};

const getTypeLabel = (title?: string) => {
  const lower = (title || "").toLowerCase();
  if (lower.includes("khách sạn") || lower.includes("hotel"))
    return "Khách sạn";
  if (lower.includes("villa") || lower.includes("biệt thự")) return "Biệt thự";
  if (lower.includes("resort")) return "Resort";
  if (lower.includes("căn hộ") || lower.includes("apartment")) return "Căn hộ";
  if (lower.includes("studio")) return "Studio";
  return "Homestay";
};

const formatCurrency = (value: number) => value.toLocaleString("vi-VN");

const getImageSrc = (image?: string) => {
  if (!image) return FALLBACK_IMAGE;
  const trimmed = image.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return FALLBACK_IMAGE;
  }
  if (!trimmed.startsWith("http")) return FALLBACK_IMAGE;
  return trimmed;
};

export default async function HomestaysPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const location =
    typeof resolvedParams.location === "string"
      ? resolvedParams.location
      : undefined;
  const guests = parseNumber(
    typeof resolvedParams.guests === "string"
      ? resolvedParams.guests
      : undefined,
  );
  const minPrice = parseNumber(
    typeof resolvedParams.minPrice === "string"
      ? resolvedParams.minPrice
      : undefined,
  );
  const maxPrice = parseNumber(
    typeof resolvedParams.maxPrice === "string"
      ? resolvedParams.maxPrice
      : undefined,
  );
  const minRating = parseNumber(
    typeof resolvedParams.minRating === "string"
      ? resolvedParams.minRating
      : undefined,
  );
  const sortParam =
    typeof resolvedParams.sort === "string"
      ? resolvedParams.sort
      : Array.isArray(resolvedParams.sort)
        ? resolvedParams.sort[0]
        : undefined;
  const sort = sortParam || "top_picks";
  const typeFilters = parseArray(resolvedParams.type);
  const amenityFilters = parseArray(resolvedParams.amenity);
  const policyFilters = parseArray(resolvedParams.policy);
  const distanceMax = parseNumber(
    typeof resolvedParams.distanceMax === "string"
      ? resolvedParams.distanceMax
      : undefined,
  );
  const checkIn =
    typeof resolvedParams.checkIn === "string"
      ? resolvedParams.checkIn
      : undefined;
  const checkOut =
    typeof resolvedParams.checkOut === "string"
      ? resolvedParams.checkOut
      : undefined;

  const detailParams = new URLSearchParams();
  if (checkIn) detailParams.set("checkIn", checkIn);
  if (checkOut) detailParams.set("checkOut", checkOut);
  if (typeof guests === "number" && !Number.isNaN(guests)) {
    detailParams.set("guests", String(guests));
  }
  const detailQuery = detailParams.toString();

  const { properties, total } = await getProperties({
    location,
    checkIn,
    checkOut,
    guests,
    minPrice,
    maxPrice,
    minRating,
    sort,
    types: typeFilters,
    amenities: amenityFilters,
    policies: policyFilters,
    distanceMax,
  });
  const favoriteIds = await getFavoriteIds(properties.map((p: any) => p.id));

  const clearParams = new URLSearchParams();
  if (location) clearParams.set("location", location);
  if (checkIn) clearParams.set("checkIn", checkIn);
  if (checkOut) clearParams.set("checkOut", checkOut);
  const clearHref = clearParams.toString()
    ? `/homestays?${clearParams.toString()}`
    : "/homestays";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {location
              ? `Tìm thấy ${total} chỗ ở tại "${location}"`
              : "Khám phá tất cả chỗ ở"}
          </h1>
          <p className="text-sm text-gray-500">
            Chọn bộ lọc để thu hẹp kết quả và tìm chỗ ở phù hợp nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Filter className="w-4 h-4 text-rose-600" />
                <h2 className="text-lg font-bold">Bộ lọc nâng cao</h2>
              </div>
              <form
                id="homestay-filters"
                method="get"
                action="/homestays"
                className="space-y-6"
              >
                {location && (
                  <input type="hidden" name="location" value={location} />
                )}
                {checkIn && (
                  <input type="hidden" name="checkIn" value={checkIn} />
                )}
                {checkOut && (
                  <input type="hidden" name="checkOut" value={checkOut} />
                )}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Ngân sách mỗi đêm
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      name="minPrice"
                      defaultValue={minPrice ?? ""}
                      placeholder="Từ"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      defaultValue={maxPrice ?? ""}
                      placeholder="Đến"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Xếp hạng đánh giá
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {[4.5, 4.0, 3.5].map((value) => (
                      <label key={value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="minRating"
                          value={value}
                          defaultChecked={minRating === value}
                          className="h-4 w-4 text-rose-600"
                        />
                        {value}+ điểm
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="minRating"
                        value=""
                        defaultChecked={!minRating}
                        className="h-4 w-4 text-rose-600"
                      />
                      Tất cả
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Số khách
                  </h3>
                  <select
                    name="guests"
                    defaultValue={guests ?? ""}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Bất kỳ</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                      <option key={value} value={value}>
                        {value} khách
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Lọc phổ biến
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {POPULAR_FILTERS.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          name="policy"
                          value={item.value}
                          defaultChecked={policyFilters.includes(item.value)}
                          className="h-4 w-4 text-rose-600"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Loại chỗ ở
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {TYPE_OPTIONS.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          name="type"
                          value={item.value}
                          defaultChecked={typeFilters.includes(item.value)}
                          className="h-4 w-4 text-rose-600"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Tiện nghi
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {AMENITY_OPTIONS.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          name="amenity"
                          value={item.value}
                          defaultChecked={amenityFilters.includes(item.value)}
                          className="h-4 w-4 text-rose-600"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Khoảng cách đến trung tâm
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {DISTANCE_OPTIONS.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          name="distanceMax"
                          value={item.value}
                          defaultChecked={distanceMax === item.value}
                          className="h-4 w-4 text-rose-600"
                        />
                        {item.label}
                      </label>
                    ))}
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="distanceMax"
                        value=""
                        defaultChecked={!distanceMax}
                        className="h-4 w-4 text-rose-600"
                      />
                      Tất cả khoảng cách
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500"
                >
                  Áp dụng bộ lọc
                </button>
                <Link
                  href={clearHref}
                  className="block text-center text-sm font-semibold text-gray-500 hover:text-gray-700"
                >
                  Xóa bộ lọc
                </Link>
              </form>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-sm text-gray-500">{total} chỗ ở</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-gray-600">
                  Sắp xếp
                </label>
                <select
                  name="sort"
                  form="homestay-filters"
                  defaultValue={sort}
                  className="rounded-full border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="top_picks">Gợi ý hàng đầu</option>
                  <option value="price_asc">Giá thấp đến cao</option>
                  <option value="price_desc">Giá cao đến thấp</option>
                  <option value="rating_desc">Đánh giá cao nhất</option>
                </select>
                <button
                  type="submit"
                  form="homestay-filters"
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-500">
                  Không tìm thấy chỗ ở phù hợp.
                </h2>
                <p className="text-gray-400 mt-2">
                  Vui lòng thử lại với bộ lọc khác.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {properties.map((homestay: any) => {
                  const isFavorited = favoriteIds.includes(homestay.id);
                  const detailSlug = homestay.slug || homestay.id;
                  const detailHref = detailQuery
                    ? `/homestays/${detailSlug}?${detailQuery}`
                    : `/homestays/${detailSlug}`;
                  const imageSrc = getImageSrc(homestay.image);
                  const ratingValue = Number(homestay.rating || 0) || 4.6;
                  const ratingLabel = getRatingLabel(ratingValue);
                  const seed = getSeed(
                    String(
                      homestay.id || homestay.slug || homestay.title || "",
                    ),
                  );
                  const reviewCount = 50 + (seed % 450);
                  const distanceKm =
                    typeof homestay.distance_km === "number"
                      ? homestay.distance_km
                      : ((seed % 45) + 5) / 10;
                  const amenityTags = (homestay.amenities || [])
                    .map((amenity: string) => AMENITY_LABELS[amenity])
                    .filter(Boolean);
                  const policyFlags = homestay.policies || {};
                  const policyTags = [
                    policyFlags.freeCancellation
                      ? POLICY_LABELS.free_cancellation
                      : null,
                    policyFlags.payAtHotel ? POLICY_LABELS.pay_at_hotel : null,
                    policyFlags.noCreditCard
                      ? POLICY_LABELS.no_credit_card
                      : null,
                    policyFlags.breakfastIncluded
                      ? POLICY_LABELS.breakfast
                      : null,
                  ].filter(Boolean) as string[];
                  const highlightTags = [...policyTags, ...amenityTags].length
                    ? [...policyTags, ...amenityTags].slice(0, 3)
                    : ["Xác nhận nhanh", "Hỗ trợ 24/7", "Ưu đãi StaySaga"];
                  const roomMeta: string[] = [];

                  if (homestay.max_guests) {
                    roomMeta.push(`${homestay.max_guests} khách tối đa`);
                  }
                  if (homestay.bedrooms) {
                    roomMeta.push(`${homestay.bedrooms} phòng ngủ`);
                  }
                  if (homestay.beds) {
                    roomMeta.push(`${homestay.beds} giường`);
                  }
                  if (homestay.bathrooms) {
                    roomMeta.push(`${homestay.bathrooms} phòng tắm`);
                  }

                  const priceValue = Number(
                    homestay.price || homestay.base_price || 0,
                  );

                  return (
                    <div
                      key={homestay.id}
                      className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row">
                        <div className="relative lg:w-72">
                          <Link href={detailHref} className="block h-full">
                            <img
                              src={imageSrc}
                              alt={homestay.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </Link>
                          <FavoriteButton
                            propertyId={homestay.id}
                            initialFavorited={isFavorited}
                            className="absolute top-4 right-4 bg-white/85 backdrop-blur-sm p-2 shadow-md"
                          />
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                  {getTypeLabel(homestay.title)}
                                </span>
                                {homestay.max_guests && (
                                  <span>{homestay.max_guests} khách</span>
                                )}
                              </div>
                              <Link
                                href={detailHref}
                                className="mt-2 block text-lg font-bold text-gray-900 hover:text-rose-600"
                              >
                                {homestay.title}
                              </Link>
                              <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {homestay.location}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Cách trung tâm {distanceKm.toFixed(1)} km
                              </p>
                              {roomMeta.length > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {roomMeta.join(" · ")}
                                </p>
                              )}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {highlightTags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="lg:text-right">
                              <div className="flex items-center lg:justify-end gap-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  {ratingLabel}
                                </span>
                                <span className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
                                  {ratingValue.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {reviewCount} đánh giá
                              </p>
                              <div className="mt-4">
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(priceValue)}đ
                                </p>
                                <p className="text-xs text-gray-500">/ đêm</p>
                              </div>
                              <Link
                                href={detailHref}
                                className="mt-4 inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                              >
                                Xem phòng
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
