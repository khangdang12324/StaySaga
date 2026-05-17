"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { differenceInDays } from "date-fns";
import { getPropertyBySlug } from "../properties/actions"; // We will use this to re-verify price
import { calculateBookingPricing } from "./pricing";

export type CreateBookingPayload = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: string;
};

/**
 * Xử lý tạo Booking mới với cơ chế Pessimistic Validation
 */
export async function createBooking(formData: FormData) {
  const supabase = await createClient();
  let bookingId: string | null = null;

  // 1. Kiểm tra xác thực User
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    // Lưu lại URL đang đứng để redirect về sau khi đăng nhập (nâng cao)
    redirect("/login");
  }

  const propertyId = formData.get("propertyId") as string;
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const guests = Number(formData.get("guests"));
  const slug = formData.get("slug") as string;

  if (!Number.isInteger(guests) || guests < 1 || guests > 16) {
    return { error: "So luong khach khong hop le." };
  }

  // 2. Fetch lại giá phòng từ DB (KHÔNG BAO GIỜ TIN TƯỞNG GIÁ TỪ CLIENT GỬI LÊN)
  const { data: property, isMock } = await getPropertyBySlug(
    slug || propertyId,
  ); // Fallback for mock
  if (!property) {
    return { error: "Không tìm thấy chỗ ở này." };
  }

  // 3. Tính toán lại giá tiền ở Server
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const days = differenceInDays(end, start);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Ngay nhan va tra phong khong hop le." };
  }
  if (days <= 0) return { error: "Ngày nhận và trả phòng không hợp lệ." };

  const basePrice = property.price || (property as any).base_price || 0;
  const { totalAmount } = calculateBookingPricing(basePrice, days);

  // 4. KIỂM TRA DOUBLE-BOOKING (Race Condition Prevention)
  if (!isMock) {
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from("bookings")
      .select("id")
      .eq("homestay_id", property.id)
      .in("status", ["PENDING", "CONFIRMED"])
      .lt("check_in_date", checkOut)
      .gt("check_out_date", checkIn);

    if (overlapError) throw new Error("Database error");
    if (overlappingBookings && overlappingBookings.length > 0) {
      return {
        error:
          "Rất tiếc! Phòng đã có người đặt trong thời gian này. Vui lòng chọn ngày khác.",
      };
    }
  }

  // 5. Tạo Booking (Trạng thái PENDING)
  if (!isMock) {
    const { data: newBooking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        user_id: session.user.id,
        homestay_id: property.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests: guests,
        total_price: totalAmount,
        status: "PENDING",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Booking insert error:", insertError);
      return { error: "Lỗi hệ thống khi tạo đơn đặt phòng." };
    }

    bookingId = newBooking?.id || null;
  } else {
    const cookieStore = await cookies();
    const existing = cookieStore.get("mock_bookings");
    let mockBookings: any[] = [];

    if (existing?.value) {
      try {
        mockBookings = JSON.parse(existing.value);
      } catch {
        mockBookings = [];
      }
    }

    const snapshot = {
      id: `mock-${Date.now()}`,
      status: "PENDING",
      total_price: totalAmount,
      check_in_date: checkIn,
      check_out_date: checkOut,
      isMock: true,
      homestay: {
        name: property.title,
        slug: property.slug,
        city: property.location,
        homestay_images: [{ url: property.image }],
      },
    };

    mockBookings = [snapshot, ...mockBookings].slice(0, 10);
    cookieStore.set("mock_bookings", JSON.stringify(mockBookings), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    bookingId = snapshot.id;
  }

  // Chuyển hướng tới cổng thanh toán (Phase 7) hoặc trang thành công
  // Ở hệ thống thực tế, đây là lúc gọi Stripe API tạo PaymentIntent
  // Tạm thời redirect thẳng tới trang Booking Success
  const bookingCode = bookingId || propertyId;
  revalidatePath("/bookings");
  redirect(`/bookings/success?bookingId=${bookingCode}&checkIn=${checkIn}`);
}

export async function cancelBooking(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) {
    redirect("/bookings?error=cancel_failed");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, status")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking || booking.user_id !== session.user.id) {
    redirect("/bookings?error=cancel_failed");
  }

  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    redirect("/bookings?error=not_allowed");
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", bookingId);

  if (error) {
    redirect("/bookings?error=cancel_failed");
  }

  revalidatePath("/bookings");
  redirect("/bookings?status=cancelled");
}

export async function rescheduleBooking(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const bookingId = formData.get("bookingId") as string;
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;

  if (!bookingId || !checkIn || !checkOut) {
    redirect("/bookings?error=date_invalid");
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const days = differenceInDays(end, start);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    days <= 0
  ) {
    redirect("/bookings?error=date_invalid");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    redirect("/bookings?error=date_invalid");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, user_id, homestay_id, status, homestay:homestays(price_per_night)",
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking || booking.user_id !== session.user.id) {
    redirect("/bookings?error=reschedule_failed");
  }

  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    redirect("/bookings?error=not_allowed");
  }

  const { data: overlaps, error: overlapError } = await supabase
    .from("bookings")
    .select("id")
    .eq("homestay_id", booking.homestay_id)
    .neq("id", bookingId)
    .in("status", ["PENDING", "CONFIRMED"])
    .lt("check_in_date", checkOut)
    .gt("check_out_date", checkIn);

  if (overlapError) {
    redirect("/bookings?error=reschedule_failed");
  }

  if (overlaps && overlaps.length > 0) {
    redirect("/bookings?error=conflict");
  }

  const homestay = Array.isArray(booking.homestay)
    ? booking.homestay[0]
    : booking.homestay;
  const basePrice = homestay?.price_per_night || 0;
  const { totalAmount } = calculateBookingPricing(basePrice, days);

  const { error } = await supabase
    .from("bookings")
    .update({
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_price: totalAmount,
    })
    .eq("id", bookingId);

  if (error) {
    redirect("/bookings?error=reschedule_failed");
  }

  revalidatePath("/bookings");
  redirect("/bookings?status=rescheduled");
}

/**
 * Wrapper function for form action that returns void
 */
export async function finishBooking(formData: FormData) {
  await createBooking(formData);
}
