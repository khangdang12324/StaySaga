import { ChevronLeft, Star, CreditCard, Shield, Check, Lock, Calendar, MapPin, Users, Tag, Info, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { getPropertyBySlug } from "@/core/properties/actions";
import { createBooking, finishBooking } from "@/core/bookings/actions";
import { differenceInDays, format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Lấy dữ liệu từ URL truyền từ BookingWidget
  const checkIn = resolvedSearchParams.checkIn;
  const checkOut = resolvedSearchParams.checkOut;
  const guests = resolvedSearchParams.guests
    ? parseInt(resolvedSearchParams.guests)
    : 1;
  const stepParam = resolvedSearchParams.step;
  const firstName = resolvedSearchParams.firstName || "";
  const lastName = resolvedSearchParams.lastName || "";
  const email = resolvedSearchParams.email || "";
  const phone = resolvedSearchParams.phone || "";
  const country = resolvedSearchParams.country || "Việt Nam";
  const hasGuestInfo = Boolean(firstName && lastName && email);
  const activeStep =
    stepParam === "finish" ? "finish" : 
    stepParam === "details" && hasGuestInfo ? "details" : "info";

  if (!checkIn || !checkOut) {
    redirect(`/homestays/${resolvedParams.id}`);
  }

  // Fetch Property & Xác thực lại giá (Bảo mật)
  const { data: property } = await getPropertyBySlug(resolvedParams.id);

  if (!property) {
    return notFound();
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const days = differenceInDays(end, start);

  if (days <= 0) {
    redirect(`/homestays/${property.slug}`);
  }

  const basePrice = property.price || (property as any).base_price || 0;
  const accommodationsCost = basePrice * days;
  const totalAmount = accommodationsCost;

  const mainImage =
    property.image ||
    (property as any).images?.[0]?.url ||
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=400";

  const detailsQuery = new URLSearchParams();
  detailsQuery.set("step", "details");
  if (checkIn) detailsQuery.set("checkIn", checkIn);
  if (checkOut) detailsQuery.set("checkOut", checkOut);
  detailsQuery.set("guests", String(guests));
  if (firstName) detailsQuery.set("firstName", firstName);
  if (lastName) detailsQuery.set("lastName", lastName);
  if (email) detailsQuery.set("email", email);
  if (phone) detailsQuery.set("phone", phone);
  if (country) detailsQuery.set("country", country);
  const detailsHref = `/checkout/${resolvedParams.id}?${detailsQuery.toString()}`;

  const finishQuery = new URLSearchParams();
  finishQuery.set("step", "finish");
  if (checkIn) finishQuery.set("checkIn", checkIn);
  if (checkOut) finishQuery.set("checkOut", checkOut);
  finishQuery.set("guests", String(guests));
  if (firstName) finishQuery.set("firstName", firstName);
  if (lastName) finishQuery.set("lastName", lastName);
  if (email) finishQuery.set("email", email);
  if (phone) finishQuery.set("phone", phone);
  if (country) finishQuery.set("country", country);
  const finishHref = `/checkout/${resolvedParams.id}?${finishQuery.toString()}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/homestays/${property.slug}`}
          className="inline-flex items-center gap-2 text-gray-900 font-semibold mb-8 hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Trở về chỗ ở
        </Link>
        <div className="mb-10">
          <div className="grid grid-cols-3 items-center text-sm font-semibold text-gray-500">
            <div
              className={`flex items-center justify-center gap-2 ${
                activeStep === "info" ? "text-rose-600" : "text-gray-400"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                1
              </span>
              Your Selection
            </div>
            <div
              className={`flex items-center justify-center gap-2 ${
                activeStep === "details" ? "text-rose-600" : "text-gray-400"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                2
              </span>
              Your Details
            </div>
            <div
              className={`flex items-center justify-center gap-2 ${
                activeStep === "finish" ? "text-rose-600" : "text-gray-400"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                3
              </span>
              Finish booking
            </div>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full bg-rose-600 transition-all ${
                activeStep === "details" ? "w-2/3" : activeStep === "finish" ? "w-full" : "w-1/3"
              }`}
            />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold mb-12">Hoàn tất đặt phòng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Cột Form thanh toán & Thông tin chuyến đi */}
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-6">Chuyến đi của bạn</h2>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Ngày</h3>
                  <p className="text-gray-600 font-medium">
                    {format(start, "dd/MM/yyyy")} - {format(end, "dd/MM/yyyy")}
                  </p>
                </div>
                <Link
                  href={`/homestays/${property.slug}`}
                  className="font-bold underline text-rose-600 hover:text-rose-700"
                >
                  Chỉnh sửa
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">Khách</h3>
                  <p className="text-gray-600 font-medium">{guests} khách</p>
                </div>
                <Link
                  href={`/homestays/${property.slug}`}
                  className="font-bold underline text-rose-600 hover:text-rose-700"
                >
                  Chỉnh sửa
                </Link>
              </div>
            </section>

            <hr className="border-gray-200" />
            {activeStep === "info" ? (
              <form
                method="get"
                action={`/checkout/${property.id}`}
                className="space-y-8"
              >
                <input type="hidden" name="step" value="details" />
                <input type="hidden" name="checkIn" value={checkIn} />
                <input type="hidden" name="checkOut" value={checkOut} />
                <input type="hidden" name="guests" value={guests} />

                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Thông tin khách</h2>
                    <p className="text-gray-500">
                      Vui lòng nhập thông tin để hoàn tất đặt phòng.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Họ</label>
                      <input
                        name="lastName"
                        defaultValue={lastName}
                        required
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Tên</label>
                      <input
                        name="firstName"
                        defaultValue={firstName}
                        required
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold">Email</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={email}
                        required
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">
                        Số điện thoại
                      </label>
                      <input
                        name="phone"
                        defaultValue={phone}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Quốc gia</label>
                      <select
                        name="country"
                        defaultValue={country}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      >
                        <option value="Việt Nam">Việt Nam</option>
                        <option value="Thái Lan">Thái Lan</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Malaysia">Malaysia</option>
                      </select>
                    </div>
                  </div>
                </section>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Tiếp tục đến chi tiết
                </button>
              </form>
            ) : activeStep === "details" ? (
              <div className="space-y-8">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold mb-3">Thông tin khách</h2>
                  <p className="text-sm text-gray-600">
                    {lastName} {firstName}
                  </p>
                  <p className="text-sm text-gray-600">{email}</p>
                  {phone && <p className="text-sm text-gray-600">{phone}</p>}
                  <p className="text-sm text-gray-600">{country}</p>
                </section>

                <form
                  method="get"
                  action={`/checkout/${property.id}`}
                  className="space-y-10"
                >
                  <input type="hidden" name="step" value="finish" />
                  <input type="hidden" name="checkIn" value={checkIn} />
                  <input type="hidden" name="checkOut" value={checkOut} />
                  <input type="hidden" name="guests" value={guests} />
                  <input type="hidden" name="firstName" value={firstName} />
                  <input type="hidden" name="lastName" value={lastName} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="phone" value={phone} />
                  <input type="hidden" name="country" value={country} />

                  {/* Special Requests Section */}
                  {/* Special Requests Section */}
                  <section>
                    <h2 className="text-2xl font-bold mb-6">Yêu cầu đặc biệt</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-3">
                          Yêu cầu đặc biệt không được đảm bảo, nhưng chỗ ở sẽ cố gắng hết sức để đáp ứng nhu cầu của bạn.
                        </p>
                        <textarea
                          name="specialRequests"
                          placeholder="Vui lòng viết yêu cầu của bạn bằng tiếng Anh. (tùy chọn)"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-rose-600 resize-none"
                          rows={4}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Arrival Time Section */}
                  <section>
                    <h2 className="text-2xl font-bold mb-6">Thời gian đến của bạn</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                          Bạn có thể nhận phòng lúc 2:00 PM
                        </p>
                        <select
                          name="arrivalTime"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-rose-600"
                        >
                          <option value="">Thêm thời gian đến dự kiến (tùy chọn)</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                          <option value="5:00 PM">5:00 PM</option>
                          <option value="6:00 PM">6:00 PM</option>
                          <option value="7:00 PM">7:00 PM</option>
                          <option value="8:00 PM">8:00 PM</option>
                          <option value="9:00 PM">9:00 PM</option>
                          <option value="10:00 PM">10:00 PM</option>
                          <option value="11:00 PM">11:00 PM</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          Thời gian theo múi giờ Thành phố Hồ Chí Minh
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* House Rules Section */}
                  <section>
                    <h2 className="text-2xl font-bold mb-6">Xem lại Nội quy nhà</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-amber-800 font-medium mb-3">
                          Chủ nhà muốn bạn đồng ý với các nội quy nhà sau:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>Không hút thuốc</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>Không tổ chức tiệc/sự kiện</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>Giờ yên tĩnh từ 12:00 AM đến 6:00 AM</span>
                          </li>
                        </ul>
                        <div className="mt-4">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              name="agreeToRules"
                              required
                              className="w-4 h-4 text-rose-600 mt-1"
                            />
                            <span className="text-sm text-gray-700">
                              Bằng cách tiếp tục đến bước tiếp theo, bạn đồng ý với các nội quy nhà này.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={detailsHref}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-4 text-center text-lg font-bold text-gray-700 hover:border-gray-400"
                    >
                      Quay lại
                    </Link>
                    <button
                      type="submit"
                      className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      Hoàn tất đặt phòng {(totalAmount + accommodationsCost * 0.1 + 150000).toLocaleString("vi-VN")}đ
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold mb-3">Xác nhận cuối cùng</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Vui lòng kiểm tra lại tất cả thông tin trước khi xác nhận đặt phòng.
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Thông tin khách</p>
                      <p className="text-sm text-gray-600">{lastName} {firstName}</p>
                      <p className="text-sm text-gray-600">{email}</p>
                      {phone && <p className="text-sm text-gray-600">{phone}</p>}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Chi tiết đặt phòng</p>
                      <p className="text-sm text-gray-600">{format(start, "dd/MM/yyyy")} - {format(end, "dd/MM/yyyy")}</p>
                      <p className="text-sm text-gray-600">{days} đêm, {guests} khách</p>
                    </div>
                  </div>
                </section>

                <form action={finishBooking} className="space-y-6">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <input type="hidden" name="slug" value={property.slug} />
                  <input type="hidden" name="checkIn" value={checkIn} />
                  <input type="hidden" name="checkOut" value={checkOut} />
                  <input type="hidden" name="guests" value={guests} />
                  <input type="hidden" name="firstName" value={firstName} />
                  <input type="hidden" name="lastName" value={lastName} />
                  <input type="hidden" name="email" value={email} />
                  <input type="hidden" name="phone" value={phone} />
                  <input type="hidden" name="country" value={country} />

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      🎉 Bạn đã sẵn sàng hoàn tất đặt phòng!
                    </p>
                    <p className="text-xs text-green-700">
                      Nhấp vào nút bên dưới để xác nhận đặt phòng của bạn.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={detailsHref}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-300 px-4 py-4 text-center text-lg font-bold text-gray-700 hover:border-gray-400"
                    >
                      Quay lại
                    </Link>
                    <button
                      type="submit"
                      className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      Xác nhận và đặt phòng {totalAmount.toLocaleString("vi-VN")}đ
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Cột Chi tiết giá (Sticky) */}
          <div>
            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xl">
              {/* Property Header */}
              {/* Property Header */}
              <div className="flex gap-4 pb-6 border-b border-gray-200">
                <img
                  src={mainImage}
                  className="w-32 h-24 object-cover rounded-xl shadow-sm"
                  alt="Room"
                />
                <div className="flex flex-col justify-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    Toàn bộ chỗ ở
                  </span>
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm mt-2 font-medium">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {property.rating || "4.9"} (
                    {(property as any).reviews || 128} đánh giá)
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="py-6 border-b border-gray-200">
                <h3 className="font-bold text-lg mb-4">Chi tiết đặt phòng của bạn</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Nhận phòng</p>
                      <p className="text-gray-600 text-sm">{format(start, "EEEE, MMM dd, yyyy")}</p>
                      <p className="text-gray-500 text-sm">Từ 2:00 PM</p>
                    </div>
                    <Link
                      href={`/homestays/${property.slug}`}
                      className="text-rose-600 text-sm font-medium hover:text-rose-700"
                    >
                      Chỉnh sửa
                    </Link>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Trả phòng</p>
                      <p className="text-gray-600 text-sm">{format(end, "EEEE, MMM dd, yyyy")}</p>
                      <p className="text-gray-500 text-sm">Đến 11:00 AM</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">Tổng số</p>
                      <p className="text-gray-600 text-sm">{days} đêm, 1 căn hộ cho {guests} người lớn</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-semibold text-gray-900 mb-2">Bạn đã chọn</p>
                    <p className="text-gray-600 text-sm">1 x Deluxe Studio</p>
                    <Link
                      href={`/homestays/${property.slug}`}
                      className="text-rose-600 text-sm font-medium hover:text-rose-700 mt-2 inline-block"
                    >
                      Thay đổi lựa chọn của bạn
                    </Link>
                  </div>
                </div>
              </div>

              {/* Price Summary with Genius Discount */}
              <div className="py-6 border-b border-gray-200">
                <h3 className="font-bold text-lg mb-4">Tóm tắt giá của bạn</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Giá gốc</span>
                    <span className="text-gray-600 line-through">
                      {(accommodationsCost * 1.15).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-green-600 font-medium">Giảm giá Genius</span>
                      <p className="text-xs text-gray-500">Bạn nhận được mức giá giảm vì bạn là thành viên Genius.</p>
                    </div>
                    <span className="text-green-600 font-medium">
                      -{(accommodationsCost * 0.15).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{basePrice.toLocaleString("vi-VN")}đ x {days} đêm</span>
                    <span className="text-gray-600">{accommodationsCost.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="py-6 border-b border-gray-200">
                <div className="flex justify-between items-center text-xl font-black">
                  <span>Tổng</span>
                  <span className="text-rose-600">
                    {totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Bao gồm thuế và phí
                </p>
              </div>

              {/* Price Information */}
              <div className="py-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Thông tin giá</h4>
                  <button className="text-rose-600 text-sm font-medium hover:text-rose-700">
                    Ẩn chi tiết
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Bao gồm {(totalAmount * 0.1).toLocaleString("vi-VN")}đ trong thuế và phí
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">10% VAT</span>
                    <span className="text-gray-600">{(totalAmount * 0.1).toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>
              </div>

              {/* Payment Schedule */}
              <div className="py-6 border-b border-gray-200">
                <h4 className="font-semibold mb-3">Lịch thanh toán của bạn</h4>
                <p className="text-sm text-gray-600">
                  Bạn sẽ bị tính phí trả trước tổng giá bất cứ lúc nào.
                </p>
              </div>

              {/* Cancellation Cost */}
              <div className="py-6">
                <h4 className="font-semibold mb-3">Hủy phòng sẽ tốn bao nhiêu?</h4>
                <p className="text-sm text-gray-600">
                  Nếu bạn hủy, bạn sẽ phải trả <span className="font-medium">{totalAmount.toLocaleString("vi-VN")}đ</span>
                </p>
              </div>

              {/* Genius Benefits */}
              <div className="py-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl px-4 mx-6">
                <h4 className="font-semibold mb-2 text-purple-800">Lợi ích Genius của bạn</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-600 font-bold">15% giảm giá</span>
                </div>
                <p className="text-xs text-purple-700">
                  Bạn đang nhận được giảm giá 15% trên giá của lựa chọn này trước khi áp dụng thuế và phí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
