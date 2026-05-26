import { redirect } from "next/navigation";
import { RealtimeSubscription } from "@/components/realtime/RealtimeSubscription";
import { createClient } from "@/lib/supabase/server";
import { canAccessPartner, getUserRole, type SupabaseLike } from "@/lib/auth/roles";
import { HostExtranetShell } from "../_components/HostExtranetShell";

const currency = new Intl.NumberFormat("vi-VN");

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getDate()} thang ${date.getMonth() + 1}, ${date.getFullYear()}`;
};

export default async function HostBookingsPage() {
  const supabase = await createClient();
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
      booking_code,
      guest_name,
      guest_email,
      check_in_date,
      check_out_date,
      guests,
      total_price,
      status,
      payment_status,
      homestay:homestays!bookings_homestay_id_fkey(id, name, city, owner_id)
    `)
    .eq("homestay.owner_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Loi lay booking cho host:", error);
  }

  const visibleBookings = (bookings || []).filter((booking: any) => {
    const homestay = Array.isArray(booking.homestay) ? booking.homestay[0] : booking.homestay;
    return homestay?.owner_id === session.user.id;
  });

  const userName = session.user.user_metadata?.full_name || session.user.email || "Tai khoan doi tac";

  return (
    <HostExtranetShell active="bookings" userName={userName}>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black">Dat phong</h1>
        <p className="mt-2 text-slate-700">
          Theo doi cac don dat thuoc cho nghi cua tai khoan host hien tai.
        </p>

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
                visibleBookings.map((booking: any) => {
                  const homestay = Array.isArray(booking.homestay) ? booking.homestay[0] : booking.homestay;
                  return (
                    <tr key={booking.id} className="border-b border-slate-200 hover:bg-slate-50/40">
                      <td className="px-4 py-4 font-mono text-slate-600">
                        {booking.booking_code || booking.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">{homestay?.name || "Cho nghi"}</td>
                      <td className="px-4 py-4 text-slate-700">{homestay?.city || "Viet Nam"}</td>
                      <td className="px-4 py-4 font-medium text-slate-700">{booking.guest_name || booking.guest_email || "Khach StaySaga"}</td>
                      <td className="px-4 py-4 text-slate-700">{booking.guests || 1}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(booking.check_in_date)}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(booking.check_out_date)}</td>
                      <td className="px-4 py-4 font-bold text-[#f60057]">{booking.status}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{booking.payment_status || "UNPAID"}</td>
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
      </main>
      <RealtimeSubscription table="bookings" />
    </HostExtranetShell>
  );
}
