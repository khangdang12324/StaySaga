"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: "Ban can dang nhap de gui danh gia." };
  }

  const homestayId = formData.get("homestayId") as string;
  const ratingValue = Number(formData.get("rating"));
  const comment = (formData.get("comment") as string)?.trim();

  if (!homestayId || !comment || Number.isNaN(ratingValue)) {
    return { error: "Vui long nhap day du thong tin danh gia." };
  }

  if (ratingValue < 1 || ratingValue > 5) {
    return { error: "So sao khong hop le." };
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: bookings, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("homestay_id", homestayId)
    .lt("check_out_date", today)
    .limit(1);

  if (bookingError) {
    return { error: "Khong the kiem tra lich su dat phong." };
  }

  if (!bookings || bookings.length === 0) {
    return { error: "Ban chi co the danh gia sau khi hoan tat chuyen di." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("homestay_id", homestayId)
    .limit(1);

  if (existingError) {
    return { error: "Khong the kiem tra danh gia hien tai." };
  }

  if (existing && existing.length > 0) {
    return { error: "Ban da danh gia cho o nay." };
  }

  const { error } = await supabase.from("reviews").insert({
    user_id: session.user.id,
    homestay_id: homestayId,
    rating: ratingValue,
    comment,
  });

  if (error) {
    return { error: "Khong the gui danh gia. Vui long thu lai." };
  }

  revalidatePath("/reviews");
  return { success: true };
}
