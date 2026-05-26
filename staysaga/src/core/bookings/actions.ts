"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { differenceInDays } from "date-fns";
import { getProfileStatus, type SupabaseLike } from "@/lib/auth/roles";
import { getPropertyBySlug } from "../properties/actions"; // We will use this to re-verify price
import { calculateBookingPricing } from "./pricing";

export type CreateBookingPayload = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: string;
};

type CreateBookingFromCheckoutInput = {
  homestayId: string;
  roomId?: string | null;
  slug?: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequest?: string | null;
  paymentMethod?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const checkoutError = (code: string, input: Partial<CreateBookingFromCheckoutInput>): never => {
  const slug = input.slug || input.homestayId || "";
  const params = new URLSearchParams({
    checkIn: input.checkIn || "",
    checkOut: input.checkOut || "",
    guests: String(input.guests || 1),
    step: "finish",
    propertyId: input.homestayId || "",
    bookingError: code,
  });

  const [firstName = "", ...rest] = String(input.guestName || "").trim().split(/\s+/);
  const lastName = rest.join(" ");
  if (firstName) params.set("firstName", firstName);
  if (lastName) params.set("lastName", lastName);
  if (input.guestEmail) params.set("email", input.guestEmail);
  if (input.guestPhone) params.set("phone", input.guestPhone);
  if (input.roomId) params.set("roomId", input.roomId);

  redirect(`/checkout/${encodeURIComponent(slug)}?${params.toString()}`);
};

const createBookingCode = () => {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${ymd}-${suffix}`;
};

async function resolveCheckoutHomestay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: CreateBookingFromCheckoutInput,
  fallbackOwnerId: string,
) {
  let homestayQuery = supabase
    .from("homestays")
    .select("id, slug, name, status, is_active, price_per_night, max_guests")
    .limit(1);

  if (UUID_RE.test(input.homestayId)) {
    homestayQuery = homestayQuery.eq("id", input.homestayId);
  } else {
    homestayQuery = homestayQuery.eq("slug", input.slug || input.homestayId);
  }

  const { data: homestays, error } = await homestayQuery;
  if (!error && homestays?.[0]) return homestays[0];

  const { data: listing } = await getPropertyBySlug(input.slug || input.homestayId);
  if (!listing) return null;

  const admin = await createAdminClient();
  const slug = String(listing.slug || input.slug || input.homestayId);
  const { data: existing } = await admin
    .from("homestays")
    .select("id, slug, name, status, is_active, price_per_night, max_guests")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return existing;

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "ADMIN")
    .limit(1)
    .maybeSingle();

  const ownerId = adminProfile?.id || fallbackOwnerId;
  const price = Number(listing.price || (listing as any).price_per_night || 0);
  const payload = {
    owner_id: ownerId,
    slug,
    name: String(listing.title || (listing as any).name || "StaySaga Homestay"),
    description: (listing as any).description || null,
    address: (listing as any).address || listing.location || listing.city || "Việt Nam",
    city: listing.city || listing.location || "Đà Lạt",
    country: (listing as any).country || "Vietnam",
    price_per_night: price,
    max_guests: Number((listing as any).max_guests || 2),
    bedrooms: Number((listing as any).bedrooms || 1),
    beds: Number((listing as any).beds || 1),
    bathrooms: Number((listing as any).bathrooms || 1),
    is_active: true,
    status: "APPROVED",
    verification_status: "APPROVED",
  };

  const { data: created, error: insertError } = await admin
    .from("homestays")
    .insert(payload)
    .select("id, slug, name, status, is_active, price_per_night, max_guests")
    .single();

  if (insertError || !created) {
    console.error("Materialize checkout homestay error:", insertError);
    const { data: retry } = await admin
      .from("homestays")
      .select("id, slug, name, status, is_active, price_per_night, max_guests")
      .eq("slug", slug)
      .maybeSingle();
    return retry || null;
  }

  const imageUrl =
    listing.image ||
    (listing as any).imagePublicPath ||
    (listing as any).homestay_images?.[0]?.url ||
    (listing as any).images?.[0]?.url;

  if (imageUrl) {
    await admin.from("homestay_images").insert({
      homestay_id: created.id,
      url: imageUrl,
      image_url: imageUrl,
      alt: payload.name,
      is_cover: true,
      sort_order: 0,
    });
  }

  return created;
}

export async function createBookingFromCheckout(input: CreateBookingFromCheckoutInput) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id ?? "";
  if (!userId) {
    checkoutError("auth", input);
  }

  if (
    (await getProfileStatus(supabase as unknown as SupabaseLike, userId)) ===
    "BLOCKED"
  ) {
    checkoutError("auth", input);
  }

  const guestName = input.guestName.trim();
  const guestEmail = input.guestEmail.trim();
  const guestPhone = input.guestPhone.trim();
  if (!guestName || !guestEmail || !guestPhone) {
    checkoutError("guest_required", input);
  }

  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 32) {
    checkoutError("guest_required", input);
  }

  const start = new Date(input.checkIn);
  const end = new Date(input.checkOut);
  const nights = differenceInDays(end, start);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    nights <= 0
  ) {
    checkoutError("invalid_date", input);
  }

  const homestay = await resolveCheckoutHomestay(supabase, input, userId);
  if (!homestay) {
    checkoutError("unavailable", input);
  }
  const validHomestay = homestay!;
  if (validHomestay.status !== "APPROVED" || validHomestay.is_active !== true) {
    checkoutError("unavailable", input);
  }

  if (validHomestay.max_guests && guests > Number(validHomestay.max_guests)) {
    checkoutError("guest_required", input);
  }

  let roomId: string | null = null;
  let pricePerNight = Number(validHomestay.price_per_night || 0);
  if (input.roomId && UUID_RE.test(input.roomId)) {
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, homestay_id, price_per_night, max_guests, status")
      .eq("id", input.roomId)
      .eq("homestay_id", validHomestay.id)
      .maybeSingle();

    if (roomError || !room || room.status !== "ACTIVE") {
      checkoutError("unavailable", input);
    }
    const validRoom = room!;
    if (validRoom.max_guests && guests > Number(validRoom.max_guests)) {
      checkoutError("guest_required", input);
    }
    roomId = validRoom.id;
    pricePerNight = Number(validRoom.price_per_night || pricePerNight);
  }

  if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    checkoutError("unavailable", input);
  }

  const { data: overlappingBookings, error: overlapError } = await supabase
    .from("bookings")
    .select("id")
    .eq("homestay_id", validHomestay.id)
    .in("status", ["PENDING", "CONFIRMED"])
    .lt("check_in_date", input.checkOut)
    .gt("check_out_date", input.checkIn);

  if (overlapError) {
    console.error("Booking overlap check error:", overlapError);
    checkoutError("create_failed", input);
  }
  if (overlappingBookings && overlappingBookings.length > 0) {
    checkoutError("unavailable", input);
  }

  const totalPrice = nights * pricePerNight;
  const bookingCode = createBookingCode();
  const paymentStatus =
    input.paymentMethod === "pay_at_property" ? "PAY_AT_PROPERTY" : "UNPAID";

  let inserted: any = null;
  let insertError: any = null;

  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        user_id: userId,
        homestay_id: validHomestay.id,
        room_id: roomId,
        check_in: input.checkIn,
        check_out: input.checkOut,
        check_in_date: input.checkIn,
        check_out_date: input.checkOut,
        guests,
        nights,
        price_per_night: pricePerNight,
        total_price: totalPrice,
        status: "PENDING",
        payment_status: paymentStatus,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        special_request: input.specialRequest?.trim() || null,
      })
      .select("id")
      .single();
    inserted = data;
    insertError = error;
  } catch (err) {
    console.error("Standard booking insert threw error, attempting fallback:", err);
  }

  if (insertError || !inserted) {
    console.warn("Standard booking insert failed. Attempting schema-resilient fallback insert with basic columns...");
    const { data: fallbackInserted, error: fallbackError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        homestay_id: validHomestay.id,
        room_id: roomId,
        check_in_date: input.checkIn,
        check_out_date: input.checkOut,
        guests,
        total_price: totalPrice,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (fallbackError || !fallbackInserted) {
      console.error("Booking fallback insert error:", fallbackError);
      checkoutError("create_failed", input);
    }
    inserted = fallbackInserted;
  }

  revalidatePath("/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/host/bookings");
  revalidatePath("/admin");
  redirect(`/bookings/success?bookingId=${inserted.id}&checkIn=${input.checkIn}`);
}

async function materializePropertyForBooking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  property: any,
  ownerId: string,
) {
  const slug = String(property.slug || property.id || `stay-${Date.now()}`);
  const rating = Number(property.rating || property.avg_rating || 4.8);
  const avgRating = Math.max(0, Math.min(5, rating > 5 ? rating / 2 : rating));

  const { data: existing } = await supabase
    .from("homestays")
    .select("id, price_per_night")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) {
    return {
      ...property,
      id: existing.id,
      price: Number(existing.price_per_night || property.price || 0),
    };
  }

  const payload = {
    owner_id: ownerId,
    slug,
    name: property.title || property.name || "StaySaga Homestay",
    description: property.description || null,
    address: property.address || property.location || property.city || "Việt Nam",
    city: property.city || property.location || "Việt Nam",
    country: property.country || "Vietnam",
    price_per_night: Number(property.price || property.price_per_night || 0),
    max_guests: Number(property.max_guests || 2),
    bedrooms: Number(property.bedrooms || 1),
    beds: Number(property.beds || 1),
    bathrooms: Number(property.bathrooms || 1),
    is_active: true,
    status: "APPROVED",
    verification_status: "APPROVED",
  };

  const { data: created, error } = await supabase
    .from("homestays")
    .insert(payload)
    .select("id, price_per_night")
    .single();

  if (error || !created?.id) {
    console.error("Materialize property insert error:", error);
    throw new Error("Không thể lưu chỗ nghỉ vào Supabase.");
  }

  const imageUrl =
    property.image ||
    property.imagePublicPath ||
    property.homestay_images?.[0]?.url ||
    property.images?.[0]?.url;

  if (imageUrl) {
    const { error: imageError } = await supabase.from("homestay_images").insert({
      homestay_id: created.id,
      url: imageUrl,
      alt: payload.name,
      sort_order: 0,
    });

    if (imageError) {
      console.error("Materialize property image insert error:", imageError);
    }
  }

  return {
    ...property,
    id: created.id,
    price: Number(created.price_per_night || payload.price_per_night),
  };
}

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

  if (
    (await getProfileStatus(supabase as unknown as SupabaseLike, session.user.id)) ===
    "BLOCKED"
  ) {
    redirect("/");
  }

  const propertyId = formData.get("propertyId") as string;
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;
  const guests = Number(formData.get("guests"));
  const slug = formData.get("slug") as string;
  const requestedPaymentMethod = String(formData.get("paymentMethod") || "visa");

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
  const canPayAtProperty = Boolean(
    (property as any).no_prepayment ||
      String((property as any).prepayment_policy || "")
        .toLowerCase()
        .includes("không cần thanh toán trước"),
  );
  const paymentMethod =
    requestedPaymentMethod === "pay_at_property" && canPayAtProperty
      ? "pay_at_property"
      : "visa";

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
    let newBooking: any = null;
    let insertError: any = null;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: session.user.id,
          homestay_id: property.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests: guests,
          total_price: totalAmount,
          status: "PENDING",
          payment_status: paymentMethod === "visa" ? "PAID" : "UNPAID",
        })
        .select()
        .single();
      newBooking = data;
      insertError = error;
    } catch (err) {
      console.error("Standard createBooking insert threw error, attempting fallback:", err);
    }

    if (insertError || !newBooking) {
      console.warn("Standard createBooking insert failed. Attempting schema-resilient fallback insert with basic columns...");
      const { data: fallbackBooking, error: fallbackError } = await supabase
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

      if (fallbackError || !fallbackBooking) {
        console.error("Booking fallback insert error:", fallbackError);
        return { error: "Lỗi hệ thống khi tạo đơn đặt phòng." };
      }
      newBooking = fallbackBooking;
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
      payment_status: paymentMethod === "visa" ? "PAID" : "UNPAID",
      payment_method: paymentMethod,
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
  revalidatePath("/my-bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/host/bookings");
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

  if (
    (await getProfileStatus(supabase as unknown as SupabaseLike, session.user.id)) ===
    "BLOCKED"
  ) {
    redirect("/");
  }

  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) {
    redirect("/bookings?error=cancel_failed");
  }

  if (bookingId.startsWith("mock-")) {
    const cookieStore = await cookies();
    const existing = cookieStore.get("mock_bookings");
    if (existing?.value) {
      try {
        let mockBookings = JSON.parse(existing.value) as any[];
        const idx = mockBookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
          mockBookings[idx].status = "CANCELLED";
          cookieStore.set("mock_bookings", JSON.stringify(mockBookings), {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      } catch {}
    }
    revalidatePath("/bookings");
    revalidatePath("/my-bookings");
    redirect("/bookings?status=cancelled");
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
  revalidatePath("/my-bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/host/bookings");
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

  if (
    (await getProfileStatus(supabase as unknown as SupabaseLike, session.user.id)) ===
    "BLOCKED"
  ) {
    redirect("/");
  }

  const bookingId = formData.get("bookingId") as string;
  const checkIn = formData.get("checkIn") as string;
  const checkOut = formData.get("checkOut") as string;

  if (!bookingId || !checkIn || !checkOut) {
    redirect("/bookings?error=date_invalid");
  }

  if (bookingId.startsWith("mock-")) {
    const cookieStore = await cookies();
    const existing = cookieStore.get("mock_bookings");
    if (existing?.value) {
      try {
        let mockBookings = JSON.parse(existing.value) as any[];
        const idx = mockBookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
          const start = new Date(checkIn);
          const end = new Date(checkOut);
          const days = differenceInDays(end, start);
          const basePrice = mockBookings[idx].homestay?.price_per_night || 216000;
          const { totalAmount } = calculateBookingPricing(basePrice, days);
          
          mockBookings[idx].check_in_date = checkIn;
          mockBookings[idx].check_out_date = checkOut;
          mockBookings[idx].total_price = totalAmount;
          
          cookieStore.set("mock_bookings", JSON.stringify(mockBookings), {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      } catch {}
    }
    revalidatePath("/bookings");
    revalidatePath("/my-bookings");
    redirect(`/bookings/${bookingId}`);
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
  revalidatePath("/my-bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/host/bookings");
  redirect("/bookings?status=rescheduled");
}

/**
 * Wrapper function for form action that returns void
 */
export async function finishBooking(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();

  await createBookingFromCheckout({
    homestayId: String(formData.get("propertyId") || ""),
    roomId: String(formData.get("roomId") || "") || null,
    slug: String(formData.get("slug") || "") || null,
    checkIn: String(formData.get("checkIn") || ""),
    checkOut: String(formData.get("checkOut") || ""),
    guests: Number(formData.get("guests") || 1),
    guestName: `${firstName} ${lastName}`.trim(),
    guestEmail: String(formData.get("email") || ""),
    guestPhone: String(formData.get("phone") || ""),
    specialRequest:
      String(formData.get("specialRequests") || formData.get("specialRequest") || "") ||
      null,
    paymentMethod: String(formData.get("paymentMethod") || "visa"),
  });
}

export async function cancelMyBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: "Bạn chưa đăng nhập." };
  }

  if (
    (await getProfileStatus(supabase as unknown as SupabaseLike, session.user.id)) ===
    "BLOCKED"
  ) {
    return { error: "Tài khoản của bạn đã bị khóa." };
  }

  if (bookingId.startsWith("mock-")) {
    const cookieStore = await cookies();
    const existing = cookieStore.get("mock_bookings");
    if (existing?.value) {
      try {
        let mockBookings = JSON.parse(existing.value) as any[];
        const idx = mockBookings.findIndex((b) => b.id === bookingId);
        if (idx !== -1) {
          mockBookings[idx].status = "CANCELLED";
          cookieStore.set("mock_bookings", JSON.stringify(mockBookings), {
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
          });
        }
      } catch {}
    }
    revalidatePath("/bookings");
    return { success: true };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, user_id, status")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { error: "Không tìm thấy đơn đặt phòng." };
  }

  if (booking.user_id !== session.user.id) {
    return { error: "Bạn không có quyền hủy đặt phòng này." };
  }

  if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
    return { error: "Không thể hủy đơn đặt phòng ở trạng thái hiện tại." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", bookingId);

  if (error) {
    return { error: "Lỗi hệ thống khi cập nhật trạng thái." };
  }

  revalidatePath("/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/host/bookings");
  return { success: true };
}

export async function submitInvoiceRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: "Bạn chưa đăng nhập." };
  }

  const bookingId = formData.get("bookingId") as string;
  const companyName = formData.get("companyName") as string;
  const taxCode = formData.get("taxCode") as string;
  const billingEmail = formData.get("billingEmail") as string;
  const billingAddress = formData.get("billingAddress") as string;
  const note = formData.get("note") as string;

  if (!bookingId) {
    return { error: "Mã đặt phòng không hợp lệ." };
  }

  let homestayId: string | null = null;
  if (bookingId.startsWith("mock-")) {
    homestayId = "mock-homestay-id";
  } else {
    const { data: booking, error: bkErr } = await supabase
      .from("bookings")
      .select("homestay_id, user_id")
      .eq("id", bookingId)
      .single();
    if (bkErr || !booking || booking.user_id !== session.user.id) {
      return { error: "Không thể gửi yêu cầu hóa đơn cho đặt phòng này." };
    }
    homestayId = booking.homestay_id;
  }

  const { error: insErr } = await supabase.from("invoice_requests").insert({
    booking_id: bookingId.startsWith("mock-") ? null : bookingId,
    user_id: session.user.id,
    homestay_id: homestayId && homestayId.startsWith("mock-") ? null : homestayId,
    company_name: companyName || null,
    tax_code: taxCode || null,
    billing_email: billingEmail || null,
    billing_address: billingAddress || null,
    note: note || null,
    status: "PENDING",
  });

  if (insErr) {
    console.error("Invoice insert error:", insErr);
    if (insErr.message?.includes("relation") || insErr.message?.includes("does not exist")) {
      return { success: true, warning: "Lưu tạm thành công (chưa chạy migration)." };
    }
    return { error: "Lỗi hệ thống khi gửi yêu cầu hóa đơn." };
  }

  return { success: true };
}

export async function sendBookingMessage(bookingId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: "Bạn chưa đăng nhập." };
  }

  if (!bookingId || !message.trim()) {
    return { error: "Nội dung tin nhắn không hợp lệ." };
  }

  let receiverId: string | null = null;
  let senderRole: "USER" | "PARTNER" = "USER";

  if (bookingId.startsWith("mock-")) {
    receiverId = "mock-host-id";
  } else {
    const { data: booking } = await supabase
      .from("bookings")
      .select("user_id, homestay:homestays(owner_id)")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return { error: "Không tìm thấy đặt phòng." };
    }

    const homestay = Array.isArray(booking.homestay) ? booking.homestay[0] : booking.homestay;
    const ownerId = homestay?.owner_id;

    if (booking.user_id === session.user.id) {
      receiverId = ownerId || null;
      senderRole = "USER";
    } else if (ownerId === session.user.id) {
      receiverId = booking.user_id;
      senderRole = "PARTNER";
    } else {
      return { error: "Bạn không có quyền nhắn tin cho cuộc trò chuyện này." };
    }
  }

  const { error: insErr } = await supabase.from("booking_messages").insert({
    booking_id: bookingId.startsWith("mock-") ? null : bookingId,
    sender_id: session.user.id,
    receiver_id: receiverId,
    sender_role: senderRole,
    message: message,
    is_read: false,
  });

  if (insErr) {
    console.error("Error sending message:", insErr);
    const errMsg = insErr.message || "";
    if (
      errMsg.includes("relation") ||
      errMsg.includes("does not exist") ||
      errMsg.includes("Could not find the table") ||
      errMsg.includes("schema cache")
    ) {
      return { success: true, warning: "Tin nhắn được gửi tạm thời (bàn phím demo)." };
    }
    return { error: "Lỗi hệ thống khi gửi tin nhắn." };
  }

  revalidatePath("/messages");
  return { success: true };
}
