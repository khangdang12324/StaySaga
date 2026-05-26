import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { connection } from "next/server";
import HelpClient from "./HelpClient";

export default async function HelpPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await connection();
  const searchParams = await props.searchParams;
  const bookingId = searchParams.bookingId || "";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let bookings: any[] = [];
  if (session) {
    const { data } = await supabase
      .from("bookings")
      .select("*, homestay:homestays(id, name, slug, city, address, is_active, homestay_images(url))")
      .eq("user_id", session.user.id)
      .order("check_in_date", { ascending: false });
    bookings = data || [];
  }

  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "VN";
  const currency = cookieStore.get("currency")?.value || "VND";

  return (
    <HelpClient
      bookings={bookings}
      initialBookingId={bookingId}
      lang={lang}
      currency={currency}
      userEmail={session?.user?.email}
      userFullName={session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0]}
    />
  );
}
