import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CalendarCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { cancelBooking, rescheduleBooking } from "@/core/bookings/actions";
import SafeImage from "@/components/ui/SafeImage";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BookingsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const resolvedParams = await searchParams;
  const status =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status
      : undefined;
  const error =
    typeof resolvedParams.error === "string" ? resolvedParams.error : undefined;
  const statusMessage =
    status === "cancelled"
      ? "Da huy dat phong."
      : status === "rescheduled"
        ? "Da cap nhat ngay dat phong."
        : undefined;
  const errorMessage =
    error === "conflict"
      ? "Ngay da co nguoi dat. Vui long chon ngay khac."
      : error === "date_invalid"
        ? "Ngay dat phong khong hop le."
        : error === "not_allowed"
          ? "Khong the cap nhat don dat phong nay."
          : error
            ? "Khong the xu ly yeu cau. Vui long thu lai."
            : undefined;
  const today = new Date().toISOString().split("T")[0];

  const cookieStore = await cookies();
  const mockCookie = cookieStore.get("mock_bookings");
  let mockBookings: any[] = [];

  if (mockCookie?.value) {
    try {
      mockBookings = JSON.parse(mockCookie.value);
    } catch {
      mockBookings = [];
    }
  }

  // Fetch bookings from DB
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(name, slug, city, homestay_images(url))")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  const allBookings = [...(bookings || []), ...mockBookings];
  const hasBookings = allBookings.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-28 pb-20 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Đặt phòng & Chuyến đi
        </h1>
        <p className="text-gray-500 mb-8">
          Quản lý tất cả lịch trình du lịch của bạn tại đây.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button className="px-5 py-3 text-sm font-bold text-rose-600 border-b-2 border-rose-600">
            Sắp tới
          </button>
          <button className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Đã hoàn thành
          </button>
          <button className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Đã hủy
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        )}
        {statusMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            {statusMessage}
          </div>
        )}

        {hasBookings ? (
          <div className="space-y-4">
            {allBookings.map((booking: any) => {
              const isMock = Boolean(booking.isMock);
              const canEdit =
                !isMock &&
                (booking.status === "PENDING" ||
                  booking.status === "CONFIRMED");
              const defaultCheckIn = booking.check_in_date?.slice(0, 10) || "";
              const defaultCheckOut =
                booking.check_out_date?.slice(0, 10) || "";

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-32 md:h-auto">
                      <SafeImage
                        src={
                          booking.homestay?.homestay_images?.[0]?.url ||
                          "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=500"
                        }
                        alt={booking.homestay?.name || "Homestay"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {booking.homestay?.name || "Homestay"}
                          </h3>
                          <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {booking.homestay?.city || "Việt Nam"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                            booking.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-700"
                              : booking.status === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : booking.status === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {booking.status === "CONFIRMED"
                            ? "Đã xác nhận"
                            : booking.status === "PENDING"
                              ? "Chờ thanh toán"
                              : booking.status === "CANCELLED"
                                ? "Đã hủy"
                                : "Hoàn thành"}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-4 h-4" />{" "}
                          {booking.check_in_date} → {booking.check_out_date}
                        </span>
                        <span className="font-bold text-gray-900">
                          {Number(booking.total_price).toLocaleString("vi-VN")}đ
                        </span>
                      </div>

                      {canEdit && (
                        <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                          <form
                            action={rescheduleBooking}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2"
                          >
                            <input
                              type="hidden"
                              name="bookingId"
                              value={booking.id}
                            />
                            <input
                              type="date"
                              name="checkIn"
                              defaultValue={defaultCheckIn}
                              min={today}
                              required
                              aria-label="Ngay nhan phong"
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                            />
                            <input
                              type="date"
                              name="checkOut"
                              defaultValue={defaultCheckOut}
                              min={today}
                              required
                              aria-label="Ngay tra phong"
                              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-700 shadow-sm"
                            >
                              Doi ngay
                            </button>
                          </form>
                          <form action={cancelBooking}>
                            <input
                              type="hidden"
                              name="bookingId"
                              value={booking.id}
                            />
                            <button
                              type="submit"
                              className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                            >
                              Huy dat phong
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <CalendarCheck className="w-16 h-16 text-rose-100 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Chưa có chuyến đi nào
            </h2>
            <p className="text-gray-500 mb-6">
              Bắt đầu khám phá và đặt chỗ ở cho chuyến đi tiếp theo!
            </p>
            <Link
              href="/homestays"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md inline-block"
            >
              Khám phá Homestays
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
