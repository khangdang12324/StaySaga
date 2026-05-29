import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Download,
  Mail,
  MessageSquareText,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";
import { sendBookingMessage } from "@/core/bookings/actions";
import BookingActions from "./BookingActions";
import ChatReplyButton from "./ChatReplyButton";

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
};

const paymentLabel: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  PAY_AT_PROPERTY: "Thanh toán tại chỗ nghỉ",
  REFUNDED: "Đã hoàn tiền",
};

type HostBookingsPageProps = {
  searchParams: Promise<{ bookingId?: string }>;
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
  homestay:
    | {
        id: string;
        name: string | null;
        city: string | null;
        owner_id: string | null;
      }
    | {
        id: string;
        name: string | null;
        city: string | null;
        owner_id: string | null;
      }[]
    | null;
};

type BookingMessage = {
  id: string;
  sender_role: "USER" | "PARTNER" | "ADMIN" | "SYSTEM" | string;
  message: string;
  created_at: string | null;
};

const getHomestay = (booking: HostBooking) =>
  Array.isArray(booking.homestay) ? booking.homestay[0] : booking.homestay;

export default async function HostBookingsPage({ searchParams }: HostBookingsPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/bookings");

  const role = await getUserRole(supabase as unknown as SupabaseLike, session.user.id);
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      check_in_date,
      check_out_date,
      guests,
      total_price,
      status,
      created_at,
      guest:profiles!bookings_user_id_fkey(id, full_name, email),
      homestay:homestays!bookings_homestay_id_fkey!inner(id, name, city, owner_id)
    `)
    .eq("homestay.owner_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Loi lay booking cho host:", error);
  }

  const visibleBookings: HostBooking[] = (bookings || []).map((booking: any) => {
    const guestData = Array.isArray(booking.guest) ? booking.guest[0] : booking.guest;
    const homestayData = Array.isArray(booking.homestay) ? booking.homestay[0] : booking.homestay;

    // Calculate nights
    let nights = 1;
    if (booking.check_in_date && booking.check_out_date) {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      if (diffTime > 0) {
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    const price_per_night = booking.total_price && nights > 0 ? booking.total_price / nights : booking.total_price;

    return {
      id: booking.id,
      booking_code: `BK-${booking.id.slice(0, 8).toUpperCase()}`,
      guest_name: guestData?.full_name || "Khách StaySaga",
      guest_email: guestData?.email || null,
      guest_phone: null,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      guests: booking.guests,
      nights,
      price_per_night,
      total_price: booking.total_price,
      status: booking.status,
      payment_status: booking.status === "CONFIRMED" || booking.status === "COMPLETED" ? "PAID" : "UNPAID",
      special_request: null,
      created_at: booking.created_at,
      homestay: homestayData || null,
    };
  });

  const selectedBooking =
    visibleBookings.find((booking) => booking.id === params.bookingId) ||
    visibleBookings[0] ||
    null;
  const selectedHomestay = selectedBooking ? getHomestay(selectedBooking) : null;
  const selectedBookingId = selectedBooking?.id;

  let selectedMessages: BookingMessage[] = [];
  if (selectedBookingId) {
    const { data: messages, error: messagesError } = await supabase
      .from("booking_messages")
      .select("*")
      .eq("booking_id", selectedBookingId)
      .order("created_at", { ascending: true });

    if (!messagesError && messages) {
      selectedMessages = messages as BookingMessage[];
    }
  }

  if (selectedBooking && selectedMessages.length === 0) {
    selectedMessages = [
      {
        id: `system-${selectedBooking.id}`,
        sender_role: "SYSTEM",
        message: `Cuộc trò chuyện với ${selectedBooking.guest_name || "khách"} sẽ hiển thị tại đây. Chủ nhà có thể gửi lời chào, hỏi giờ đến hoặc xác nhận yêu cầu đặc biệt.`,
        created_at: selectedBooking.created_at || new Date().toISOString(),
      },
    ];
  }

  async function sendHostMessage(formData: FormData) {
    "use server";
    const bookingId = String(formData.get("bookingId") || "");
    const message = String(formData.get("message") || "");
    await sendBookingMessage(bookingId, message);
  }

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tài khoản đối tác";

  return (
    <HostExtranetShell active="bookings" userName={userName}>
      <main className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black">Đặt phòng</h1>
            <p className="mt-2 text-slate-700">
              Theo dõi đơn đặt, thông tin khách và trò chuyện ngay trên StaySaga.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-slate-700">
            <button type="button" className="inline-flex items-center gap-2 hover:text-[#f60057]">
              <Printer className="h-5 w-5" />
              In danh sách đặt phòng
            </button>
            <button type="button" className="inline-flex items-center gap-2 hover:text-[#f60057]">
              <Download className="h-5 w-5" />
              Tải về
            </button>
          </div>
        </div>

        <section className="mt-8 flex flex-wrap items-end gap-4">
          <label className="grid gap-2 text-sm font-bold">
            Ngày
            <select className="h-11 min-w-[160px] border border-slate-400 bg-white px-3 font-normal">
              <option>Nhận phòng</option>
              <option>Ngày đi</option>
              <option>Ngày đặt</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Lọc theo ngày
            <input
              readOnly
              value="27 tháng 5, 2026 - 28 tháng 6, 2026"
              className="h-11 w-[270px] border border-slate-400 bg-white px-3 font-normal"
            />
          </label>
          <button type="button" className="inline-flex h-11 items-center gap-2 border border-[#f60057] bg-white px-4 font-bold text-[#f60057]">
            Thêm bộ lọc
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" className="h-11 bg-[#f60057] px-5 font-bold text-white hover:bg-[#d9004c]">
            Hiển thị đặt phòng
          </button>
        </section>

        <section className="mt-8 overflow-x-auto rounded-sm border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/50">
              <tr>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Ma don</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Ten cho nghi</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Vi tri</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Ten khach</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Khach</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Nhan phong</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tra phong</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tinh trang</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Thanh toan</th>
                <th className="px-4 py-4 text-sm font-bold text-slate-800">Tong tien</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.length > 0 ? (
                visibleBookings.map((booking) => {
                  const homestay = getHomestay(booking);
                  return (
                    <tr
                      key={booking.id}
                      className={`border-b border-slate-200 hover:bg-rose-50/60 ${
                        selectedBooking?.id === booking.id ? "bg-rose-50/80" : ""
                      }`}
                    >
                      <td className="px-4 py-4 font-mono text-slate-600">
                        <Link href={`/host/bookings?bookingId=${booking.id}`} className="text-[#f60057] hover:underline">
                          {booking.booking_code || booking.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">{homestay?.name || "Cho nghi"}</td>
                      <td className="px-4 py-4 text-slate-700">{homestay?.city || "Viet Nam"}</td>
                      <td className="px-4 py-4">
                        <Link href={`/host/bookings?bookingId=${booking.id}`} className="font-bold text-[#f60057] hover:underline">
                          {booking.guest_name || booking.guest_email || "Khach StaySaga"}
                        </Link>
                        <p className="text-xs text-slate-500">{booking.guest_email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{booking.guests || 1}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(booking.check_in_date)}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(booking.check_out_date)}</td>
                      <td className="px-4 py-4 font-bold text-[#f60057]">{statusLabel[booking.status] || booking.status}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{paymentLabel[booking.payment_status || ""] || "Chưa thanh toán"}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        VND {currency.format(Number(booking.total_price || 0))}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="bg-white px-4 py-16 text-center text-[15px] font-medium text-slate-500">
                    Quy vi khong co dat phong nao.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {selectedBooking ? (
          <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <article className="border border-slate-200 bg-white p-7">
                {selectedBooking.status === "CANCELLED" && (
                  <div className="mb-6 border border-rose-350 bg-rose-50 px-5 py-4 flex items-center gap-3 text-[#f60057] font-bold text-sm">
                    <span className="h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-black">!</span>
                    <span>{selectedBooking.guest_name || "Khách"} đã hủy đặt phòng này</span>
                  </div>
                )}
                <div className="grid gap-8 md:grid-cols-[260px_1fr]">
                  <div className="space-y-6">
                    <div>
                      <p className="text-slate-500">Nhận phòng</p>
                      <p className="mt-1 text-2xl font-black">{formatDate(selectedBooking.check_in_date)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Trả phòng</p>
                      <p className="mt-1 text-2xl font-black">{formatDate(selectedBooking.check_out_date)}</p>
                    </div>
                    <InfoBlock label="Thời gian lưu trú" value={`${selectedBooking.nights || 1} đêm`} />
                    <InfoBlock label="Tổng số khách" value={`${selectedBooking.guests || 1} người lớn`} />
                    <InfoBlock label="Tổng số phòng" value="1" />
                    <InfoBlock label="Tổng tiền phòng" value={`VND ${currency.format(Number(selectedBooking.total_price || 0))}`} strong />
                  </div>
                  <div>
                    <p className="text-slate-500">Tên khách:</p>
                    <h2 className="mt-1 text-2xl font-black italic text-[#f60057]">
                      {selectedBooking.guest_name || "Khách StaySaga"}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedBooking.guest_email || "Chưa có email"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        {selectedBooking.guest_phone || "Ẩn số điện thoại"}
                      </span>
                    </div>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <InfoBlock label="Chỗ nghỉ" value={selectedHomestay?.name || "Chỗ nghỉ StaySaga"} />
                      <InfoBlock label="Mã đặt phòng" value={selectedBooking.booking_code || selectedBooking.id.slice(0, 8)} />
                      <InfoBlock label="Kênh" value="StaySaga" />
                      <InfoBlock label="Tình trạng" value={statusLabel[selectedBooking.status] || selectedBooking.status} />
                      <InfoBlock label="Thanh toán" value={paymentLabel[selectedBooking.payment_status || ""] || "Chưa thanh toán"} />
                      <InfoBlock label="Được đặt" value={formatDate(selectedBooking.created_at)} />
                    </div>
                    <div className="mt-7 border-t border-slate-200 pt-5">
                      <p className="font-bold">Ghi chú của khách</p>
                      <p className="mt-2 text-slate-700">
                        {selectedBooking.special_request || "Khách chưa gửi yêu cầu đặc biệt."}
                      </p>
                    </div>
                  </div>
                </div>
              </article>

              {/* Room details card exactly matching screenshot 5 */}
              <div className="border border-slate-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{selectedHomestay?.name || "Chỗ nghỉ"}</h3>
                    {selectedBooking.status === "CANCELLED" && (
                      <span className="bg-red-650 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-[3px] uppercase tracking-wider">
                        Hủy bởi khách
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm">
                      VND {currency.format(Number(selectedBooking.total_price || 0))}
                    </strong>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span>→</span>
                  <span>{formatDate(selectedBooking.check_in_date)}</span>
                  <span>—</span>
                  <span>{formatDate(selectedBooking.check_out_date)}</span>
                </div>
              </div>

              <article className="border border-slate-200 bg-white p-7">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-black">Trò chuyện với khách</h2>
                  <MessageSquareText className="h-6 w-6 text-[#f60057]" />
                </div>
                <div className="mt-6 min-h-[280px] space-y-4 rounded-sm bg-slate-50 p-5">
                  {selectedMessages.map((message) => {
                    const isHost = message.sender_role === "PARTNER";
                    const isGuest = message.sender_role === "USER";
                    return (
                      <div key={message.id} className={`flex ${isHost ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[78%] rounded-sm px-4 py-3 shadow-sm ${
                            isHost
                              ? "bg-[#f60057] text-white"
                              : isGuest
                                ? "bg-white text-slate-900"
                                : "border border-rose-200 bg-white text-slate-700"
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wide opacity-75">
                            {isHost ? "Bạn" : isGuest ? "Khách" : "StaySaga"}
                          </p>
                          <p className="mt-1 leading-6">{message.message}</p>
                          <ChatReplyButton
                            messageText={message.message}
                            senderRole={message.sender_role}
                            bookingId={selectedBooking.id}
                            bookingStatus={selectedBooking.status}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form action={sendHostMessage} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="bookingId" value={selectedBooking.id} />
                  <textarea
                    name="message"
                    required
                    rows={3}
                    placeholder="Nhập tin nhắn cho khách..."
                    className="min-h-24 resize-none border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#f60057]"
                  />
                  <button type="submit" className="h-12 self-end bg-[#f60057] px-7 font-bold text-white hover:bg-[#d9004c]">
                    Gửi
                  </button>
                </form>
                <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-slate-700">
                  <ShieldCheck className="mr-2 inline h-4 w-4 text-[#f60057]" />
                  Không chia sẻ thông tin nhạy cảm qua tin nhắn. StaySaga lưu cuộc trò chuyện để hỗ trợ khi có tranh chấp.
                </div>
              </article>
            </div>

            <aside className="h-fit space-y-5">
              <BookingActions booking={selectedBooking} hotelName={selectedHomestay?.name || "Chỗ nghỉ"} />
              <div className="border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-black">Thanh toán</h3>
                <p className="mt-4 inline-flex rounded-sm bg-slate-100 px-2 py-1 text-sm font-bold">
                  {paymentLabel[selectedBooking.payment_status || ""] || "Không cần thẻ tín dụng"}
                </p>
                <p className="mt-4 text-slate-700">
                  Tổng tiền khách cần thanh toán:{" "}
                  <strong>VND {currency.format(Number(selectedBooking.total_price || 0))}</strong>
                </p>
              </div>
              <div className="border border-rose-200 bg-rose-50 p-6">
                <div className="flex gap-3">
                  <CalendarDays className="mt-1 h-5 w-5 text-[#f60057]" />
                  <div>
                    <p className="font-bold">Khách không xuất hiện?</p>
                    <Link href="/help" className="mt-1 inline-flex text-[#f60057]">
                      Tôi có thể làm gì bây giờ?
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        ) : null}
      </main>
      <RealtimeSubscription table="bookings" />
    </HostExtranetShell>
  );
}

function InfoBlock({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={`mt-1 ${strong ? "text-2xl font-black" : "font-semibold text-slate-900"}`}>{value}</p>
    </div>
  );
}
