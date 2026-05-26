import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { sendBookingMessage } from "@/core/bookings/actions";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await connection();
  const searchParams = await props.searchParams;
  const queryBookingId = searchParams.bookingId;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/messages${queryBookingId ? `?bookingId=${queryBookingId}` : ""}`);
  }

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";

  // Fetch user profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", session.user.id)
    .single();

  const userFullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0];
  const userAvatar = profile?.avatar_url || session.user.user_metadata?.avatar_url || "";

  // Fetch relevant bookings for this user:
  // 1. Where they are the guest
  const allBookings: any[] = [];
  const { data: guestBookings, error: gError } = await supabase
    .from("bookings")
    .select("*, homestay:homestays(id, name, slug, city, owner_id, homestay_images(url))")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (guestBookings) {
    for (const b of guestBookings) {
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
    allBookings.push(...guestBookings);
  }

  // 2. Where they are the host (own the homestay)
  const { data: ownedHomestays } = await supabase
    .from("homestays")
    .select("id")
    .eq("owner_id", session.user.id);

  if (ownedHomestays && ownedHomestays.length > 0) {
    const ownedIds = ownedHomestays.map((h) => h.id);
    const { data: hostBookings } = await supabase
      .from("bookings")
      .select("*, homestay:homestays(id, name, slug, city, owner_id, homestay_images(url))")
      .in("homestay_id", ownedIds)
      .neq("user_id", session.user.id) // prevent duplication
      .order("created_at", { ascending: false });

    if (hostBookings) {
      for (const b of hostBookings) {
        const guestId = b.user_id;
        if (guestId) {
          const { data: guestProfile } = await supabase
            .from("profiles")
            .select("email, phone, full_name")
            .eq("id", guestId)
            .single();
          
          if (guestProfile && b.homestay) {
            b.homestay.owner = guestProfile;
          }
        }
      }
      allBookings.push(...hostBookings);
    }
  }

  // Fetch messages from booking_messages table if it exists
  const bookingIds = allBookings.map((b) => b.id);
  let dbMessages: any[] = [];

  if (bookingIds.length > 0) {
    const { data: msgs, error: msgsErr } = await supabase
      .from("booking_messages")
      .select("*")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: true });

    if (!msgsErr && msgs) {
      dbMessages = msgs;
    } else {
      console.warn("booking_messages query skipped or failed (table may not exist yet):", msgsErr?.message);
    }
  }

  // Map bookings to conversations with messages
  const conversations = allBookings.map((booking) => {
    const bookingMsgs = dbMessages.filter((m) => m.booking_id === booking.id);
    
    // If no messages exist in the database, synthesize the default welcome message
    if (bookingMsgs.length === 0) {
      const homestay = Array.isArray(booking.homestay) ? booking.homestay[0] : booking.homestay;
      const hotelName = homestay?.name || "chỗ nghỉ";
      const systemWelcome = {
        id: `system-welcome-${booking.id}`,
        booking_id: booking.id,
        sender_role: "SYSTEM",
        message: `Chào mừng đến với ${hotelName}! Anh/Chị vui lòng cho em xin thời gian dự kiến nhận phòng để chỗ nghỉ xác nhận đơn đặt phòng này ạ.`,
        created_at: booking.created_at || new Date().toISOString(),
        is_read: true,
      };
      
      return {
        booking,
        messages: [systemWelcome],
      };
    }

    return {
      booking,
      messages: bookingMsgs,
    };
  });

  return (
    <MessagesClient
      conversations={conversations}
      selectedBookingIdFromUrl={queryBookingId}
      lang={lang}
      currency={currency}
      sendMessageAction={sendBookingMessage}
      userFullName={userFullName}
      userAvatar={userAvatar}
      userId={session.user.id}
    />
  );
}
