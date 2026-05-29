import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../../_components/HostExtranetShell";
import { HostPageHeader } from "@/components/host/HostPageHeader";
import { EmptyState } from "@/components/host/EmptyState";
import { CalendarDays, AlertCircle, MessageCircle, Ban } from "lucide-react";

const currency = new Intl.NumberFormat("vi-VN");

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
};

const statusLabel: Record<string, string> = {
  PENDING: "Chờ phản hồi",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn tất",
  NO_SHOW: "Khách không đến",
  CANCEL_REQUESTED: "Yêu cầu hủy",
};

const paymentLabel: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  PAY_AT_PROPERTY: "Thanh toán tại chỗ nghỉ",
  REFUNDED: "Đã hoàn tiền",
};

type HostBooking = {
  id: string;
  booking_code: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  guests: number | null;
  nights: number | null;
  price_per_night: number | null;
  total_price: number | null;
  status: string;
  payment_status: string | null;
  special_request: string | null;
  created_at: string | null;
  homestay: {
    id: string;
    name: string | null;
    city: string | null;
    owner_id: string | null;
  } | null;
};

type Params = Promise<{ sub: string }>;

export default async function HostBookingsSubPage({ params }: { params: Params }) {
  const { sub } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect(`/login?next=/host/bookings/${sub}`);

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  // Fetch bookings from database
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      guest_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      guests,
      nights,
      price_per_night,
      total_price,
      status,
      payment_status,
      special_request,
      created_at,
      homestay:homestays!bookings_homestay_id_fkey(id, name, city, owner_id)
    `)
    .eq("homestay.owner_id", session.user.id)
    .order("created_at", { ascending: false });

  const rawBookings = (bookings || []) as unknown as HostBooking[];

  // Filter bookings based on sub segment
  let filteredBookings = rawBookings;
  let pageTitle = "Đặt phòng";
  let pageDesc = "Quản lý đơn đặt phòng.";
  let breadcrumbLabel = "Chi tiết";

  const todayStr = new Date().toISOString().split("T")[0];

  if (sub === "upcoming") {
    pageTitle = "Đặt phòng sắp tới";
    pageDesc = "Danh sách khách chuẩn bị check-in và đang lưu trú.";
    breadcrumbLabel = "Sắp tới";
    filteredBookings = rawBookings.filter(
      (b) =>
        (b.status === "CONFIRMED" || b.status === "PENDING") &&
        b.check_in_date &&
        b.check_in_date >= todayStr
    );
  } else if (sub === "cancellations") {
    pageTitle = "Đặt phòng đã hủy";
    pageDesc = "Tất cả các đơn hàng đã bị hủy bởi khách hoặc do hết hạn thanh toán.";
    breadcrumbLabel = "Đã hủy";
    filteredBookings = rawBookings.filter((b) => b.status === "CANCELLED");
  } else if (sub === "cancel-requests") {
    pageTitle = "Yêu cầu hủy phòng";
    pageDesc = "Các đơn đặt phòng khách đang đề nghị hủy hoặc thương lượng hoàn tiền.";
    breadcrumbLabel = "Yêu cầu hủy";
    filteredBookings = rawBookings.filter(
      (b) => b.status === "CANCEL_REQUESTED"
    );
  } else if (sub === "messages") {
    pageTitle = "Tin nhắn theo đặt phòng";
    pageDesc = "Các cuộc hội thoại tương tác với khách hàng theo từng mã booking.";
    breadcrumbLabel = "Tin nhắn";
    // For messages subpage, list bookings that have requests or messages
    filteredBookings = rawBookings;
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="bookings" userName={userName}>
      <main className="mx-auto max-w-[1380px] px-6 py-10">
        <HostPageHeader
          title={pageTitle}
          description={pageDesc}
          breadcrumbs={[
            { label: "Đặt phòng", href: "/host/bookings" },
            { label: breadcrumbLabel },
          ]}
        />

        {filteredBookings.length === 0 ? (
          <EmptyState
            title="Không có đơn đặt phòng nào"
            description={`Hiện tại không tìm thấy đơn đặt phòng nào thuộc nhóm '${pageTitle.toLowerCase()}'.`}
            actionHref="/host/bookings"
            actionLabel="Xem tất cả đặt phòng"
          />
        ) : (
          <div className="space-y-6">
            {sub === "cancel-requests" && (
              <div className="border border-rose-300 bg-rose-50 p-5 text-sm text-[#f60057] flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">Lưu ý về chính sách hủy phòng:</p>
                  <p className="mt-1">
                    Vui lòng phản hồi các yêu cầu hủy phòng từ khách hàng trong vòng 24 giờ để duy trì điểm chất lượng dịch vụ cao trên StaySaga.
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto border border-gray-250 bg-white">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-gray-250 bg-gray-50/50">
                  <tr>
                    <th className="px-5 py-4 font-bold text-slate-700">Mã đơn</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Chỗ nghỉ</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Tên khách</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Số khách</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Nhận phòng</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Trả phòng</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Thanh toán</th>
                    <th className="px-5 py-4 font-bold text-slate-700">Tổng tiền</th>
                    {sub === "messages" && <th className="px-5 py-4 font-bold text-center text-slate-700">Trò chuyện</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const homestay = booking.homestay;
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-mono text-slate-600">
                          <Link
                            href={`/host/bookings?bookingId=${booking.id}`}
                            className="text-[#f60057] hover:underline"
                          >
                            {booking.booking_code || booking.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {homestay?.name || "Chỗ nghỉ"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-900">
                            {booking.guest_name || "Khách hàng"}
                          </span>
                          <p className="text-xs text-slate-500">{booking.guest_email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{booking.guests || 1}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {formatDate(booking.check_in_date)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {formatDate(booking.check_out_date)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`font-bold ${
                              booking.status === "CANCELLED"
                                ? "text-rose-600"
                                : booking.status === "CONFIRMED"
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                            }`}
                          >
                            {statusLabel[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {paymentLabel[booking.payment_status || ""] || "Chưa thanh toán"}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {booking.total_price
                            ? `${currency.format(Number(booking.total_price))} VND`
                            : "-"}
                        </td>
                        {sub === "messages" && (
                          <td className="px-5 py-4 text-center">
                            <Link
                              href={`/host/bookings?bookingId=${booking.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-[#f60057] hover:bg-rose-100"
                              title="Mở hộp hội thoại"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </HostExtranetShell>
  );
}
