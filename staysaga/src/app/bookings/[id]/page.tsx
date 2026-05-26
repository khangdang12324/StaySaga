import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { cancelMyBooking, rescheduleBooking } from "@/core/bookings/actions";
import TripDetailClient from "./TripDetailClient";
import { connection } from "next/server";

export default async function BookingDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const params = await props.params;
  const bookingId = params.id;

  if (!bookingId) {
    redirect("/bookings");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/bookings/${bookingId}`);
  }

  const userEmail = session.user.email || "";
  const userFullName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
  const userAvatar = session.user.user_metadata?.picture || session.user.user_metadata?.avatar_url || "";

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";

  // Fetch the booking from Supabase.
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(id, name, slug, city, address, owner_id, latitude, longitude, homestay_images(url))")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    console.error("Fetch booking error:", fetchErr);
    redirect("/bookings?error=booking_not_found");
  }

  // Security check: Only the owner of the booking (user_id) can view this booking details.
  if (booking.user_id !== session.user.id) {
    console.warn(`Access denied: User ${session.user.id} tried to access booking owned by ${booking.user_id}`);
    redirect("/bookings?error=access_denied");
  }

  // Fetch all user bookings to find others in the same city
  const { data: allUserBookings } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(id, name, slug, city, address, owner_id, latitude, longitude, homestay_images(url))")
    .eq("user_id", session.user.id)
    .order("check_in_date", { ascending: true });

  const city = booking.homestay?.city || booking.homestay?.address?.split(",")?.slice(-1)?.[0]?.trim() || "Đà Lạt";
  const cleanCity = city === "Việt Nam" ? "Đà Lạt" : city;

  const bookingsInCity = allUserBookings?.filter((b: any) => {
    const bCity = b.homestay?.city || b.homestay?.address?.split(",")?.slice(-1)?.[0]?.trim() || "Đà Lạt";
    const cleanBCity = bCity === "Việt Nam" ? "Đà Lạt" : bCity;
    return cleanBCity === cleanCity;
  }) || [booking];

  // Fetch host profiles for all bookings in this city
  for (const b of bookingsInCity) {
    const hostId = b.homestay?.owner_id;
    if (hostId) {
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("email, phone")
        .eq("id", hostId)
        .single();
      
      if (hostProfile && b.homestay) {
        b.homestay.owner = hostProfile;
      }
    }
  }

  return (
    <TripDetailClient
      booking={booking}
      bookingsInCity={bookingsInCity}
      userEmail={userEmail}
      userFullName={userFullName}
      userAvatar={userAvatar}
      lang={lang}
      currency={currency}
      cancelAction={cancelMyBooking}
      rescheduleAction={rescheduleBooking}
    />
  );
}
