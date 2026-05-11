import { ChevronLeft, Star } from "lucide-react";
import Link from "next/link";
import { getPropertyBySlug } from "@/core/properties/actions";
import { createBooking } from "@/core/bookings/actions";
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
    stepParam === "payment" && hasGuestInfo ? "payment" : "info";

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
  const cleaningFee = 300000;
  const serviceFee = Math.round(accommodationsCost * 0.12);
  const totalAmount = accommodationsCost + cleaningFee + serviceFee;

  const mainImage =
    property.image ||
    (property as any).images?.[0]?.url ||
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=400";

  const infoQuery = new URLSearchParams();
  infoQuery.set("step", "info");
  if (checkIn) infoQuery.set("checkIn", checkIn);
  if (checkOut) infoQuery.set("checkOut", checkOut);
  infoQuery.set("guests", String(guests));
  if (firstName) infoQuery.set("firstName", firstName);
  if (lastName) infoQuery.set("lastName", lastName);
  if (email) infoQuery.set("email", email);
  if (phone) infoQuery.set("phone", phone);
  if (country) infoQuery.set("country", country);
  const infoHref = `/checkout/${resolvedParams.id}?${infoQuery.toString()}`;

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
              Thông tin khách
            </div>
            <div
              className={`flex items-center justify-center gap-2 ${
                activeStep === "payment" ? "text-rose-600" : "text-gray-400"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                2
              </span>
              Thanh toán
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-xs">
                3
              </span>
              Hoàn tất
            </div>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full bg-rose-600 transition-all ${
                activeStep === "payment" ? "w-2/3" : "w-1/3"
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
                  <p className="text-gray-600 font-medium">
                    {guests} khách
                  </p>
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
                <input type="hidden" name="step" value="payment" />
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
                      <label className="text-sm font-semibold">Số điện thoại</label>
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
                  Tiếp tục chọn thanh toán
                </button>
              </form>
            ) : (
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

                <form action={createBooking} className="space-y-10">
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

                  <section>
                    <h2 className="text-2xl font-bold mb-6">
                      Chọn phương thức thanh toán
                    </h2>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-300 rounded-xl cursor-pointer hover:border-rose-600 transition-colors bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="PAY_AT_HOTEL"
                            className="w-5 h-5 text-rose-600"
                            defaultChecked
                          />
                          <span className="font-semibold text-lg">
                            Thanh toán tại khách sạn
                          </span>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-300 rounded-xl cursor-pointer hover:border-rose-600 transition-colors bg-white shadow-sm">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="CARD"
                            className="w-5 h-5 text-rose-600"
                          />
                          <span className="font-semibold text-lg">
                            Thẻ Visa/Mastercard
                          </span>
                        </div>
                      </label>
                    </div>
                  </section>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={infoHref}
                      className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:border-gray-400"
                    >
                      Quay lại
                    </Link>
                    <button
                      type="submit"
                      className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      Xác nhận đặt phòng {totalAmount.toLocaleString("vi-VN")}đ
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Cột Chi tiết giá (Sticky) */}
          <div>
            <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xl">
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

              <div className="py-6 border-b border-gray-200 space-y-4">
                <h3 className="font-bold text-xl mb-4">Chi tiết giá</h3>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>
                    {basePrice.toLocaleString("vi-VN")}đ x {days} đêm
                  </span>
                  <span>{accommodationsCost.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Phí dọn dẹp</span>
                  <span>{cleaningFee.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Phí dịch vụ StaySaga</span>
                  <span>{serviceFee.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center text-xl font-black">
                <span>Tổng (VND)</span>
                <span className="text-rose-600">
                  {totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
