"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  canAccessAdmin,
  getProfileStatus,
  getUserRole,
  type AppRole,
  type ProfileStatus,
} from "@/lib/auth/roles";
import {
  ACTIVE_BOOKING_STATUSES,
  isPropertyStatus,
  type PropertyStatus,
} from "@/core/properties/status";

const ALLOWED_ROLES = new Set<AppRole>(["USER", "PARTNER", "ADMIN"]);
const ALLOWED_PROFILE_STATUSES = new Set<ProfileStatus>(["ACTIVE", "BLOCKED"]);
const ALLOWED_BOOKING_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
  "CHECKED_IN",
  "NO_SHOW",
]);
const ALLOWED_REVIEW_STATUSES = new Set(["VISIBLE", "HIDDEN"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToProperties(status: string): never {
  redirect(`/admin/properties?status=${status}`);
}

function getPropertyActivity(status: PropertyStatus) {
  return status === "APPROVED";
}

function revalidatePropertyViews(propertyId?: string) {
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  revalidatePath("/host");
  revalidatePath("/host", "layout");
  revalidatePath("/host/list");
  revalidatePath("/host/property");
  revalidatePath("/host/availability");
  revalidatePath("/homestays");
  revalidatePath("/");

  if (propertyId) {
    revalidatePath(`/host/${propertyId}`);
  }
}

async function updateHomestayWithMetadataFallback(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  id: string,
  payload: Record<string, unknown>,
  fallbackPayload: Record<string, unknown>,
) {
  const result = await supabase.from("homestays").update(payload).eq("id", id);
  if (!result.error) return result;

  const message = String(result.error.message || "").toLowerCase();
  const shouldRetry =
    result.error.code === "42703" ||
    message.includes("column") ||
    message.includes("schema cache");

  if (!shouldRetry) return result;

  return supabase.from("homestays").update(fallbackPayload).eq("id", id);
}

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const authSupabase = supabase as unknown as Parameters<typeof getUserRole>[0];
  const role = await getUserRole(authSupabase, session.user.id);
  const status = await getProfileStatus(authSupabase, session.user.id);

  if (status === "BLOCKED" || !canAccessAdmin(role)) {
    redirect("/");
  }

  const adminSupabase = await createAdminClient();
  return { supabase: adminSupabase, user: session.user };
}

export async function updateUserAccess(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");
  const role = getString(formData, "role") as AppRole;
  const status = (getString(formData, "status") || "ACTIVE") as ProfileStatus;

  if (!id || !ALLOWED_ROLES.has(role) || !ALLOWED_PROFILE_STATUSES.has(status)) {
    redirect("/admin/users?error=invalid");
  }

  if (id === user.id && (role !== "ADMIN" || status === "BLOCKED")) {
    redirect("/admin/users?error=self_lock");
  }

  const { error } = await supabase.from("profiles").update({ role, status }).eq("id", id);
  if (error && String(error.message || "").toLowerCase().includes("status")) {
    const { error: roleOnlyError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (roleOnlyError) {
      redirect("/admin/users?error=update_failed");
    }
  } else if (error) {
    redirect("/admin/users?error=update_failed");
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/partners");
  redirect("/admin/users?status=updated");
}

export async function updatePropertyStatus(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");
  const status = getString(formData, "status") as PropertyStatus;

  if (!id || !isPropertyStatus(status)) {
    redirect("/admin/properties?error=invalid");
  }

  if (status === "DELETED") {
    const activeBookings = await countActiveBookings(supabase, id);
    if (activeBookings > 0) {
      redirect("/admin/properties?error=active_bookings");
    }
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      status,
      is_active: getPropertyActivity(status),
      updated_at: new Date().toISOString(),
      ...(status === "DELETED"
        ? { deleted_at: new Date().toISOString(), deleted_by: user.id }
        : {}),
    })
    .eq("id", id);
  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePropertyViews(id);
  redirectToProperties("updated");
}

export async function approveProperty(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");

  if (!id) {
    redirect("/admin/properties?error=invalid");
  }

  const now = new Date().toISOString();
  const basePayload = {
    status: "APPROVED",
    is_active: true,
    rejection_reason: null,
    updated_at: now,
  };
  const { error } = await updateHomestayWithMetadataFallback(
    supabase,
    id,
    {
      ...basePayload,
      status: "APPROVED",
      is_active: true,
      verification_status: "APPROVED",
      rejection_reason: null,
      approved_at: now,
      approved_by: user.id,
      reviewed_at: now,
      reviewed_by: user.id,
    },
    basePayload,
  );

  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePropertyViews(id);
  redirectToProperties("approved");
}

export async function rejectProperty(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");
  const reason = getString(formData, "reason");

  if (!id || reason.length < 3) {
    redirect("/admin/properties?error=invalid");
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      status: "REJECTED",
      is_active: false,
      verification_status: "REJECTED",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  revalidatePath("/host");
  revalidatePath("/host/list");
  revalidatePath("/homestays");
  redirectToProperties("rejected");
}

export async function approveDeleteProperty(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");

  if (!id) {
    redirect("/admin/properties?error=invalid");
  }

  const activeBookings = await countActiveBookings(supabase, id);
  if (activeBookings > 0) {
    redirect("/admin/properties?error=active_bookings");
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      status: "DELETED",
      is_active: false,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  revalidatePath("/host");
  revalidatePath("/host/list");
  revalidatePath("/homestays");
  redirectToProperties("deleted");
}

export async function rejectDeleteProperty(formData: FormData) {
  const { supabase } = await getAdminClient();
  const id = getString(formData, "id");
  const reason = getString(formData, "reason");

  if (!id || reason.length < 3) {
    redirect("/admin/properties?error=invalid");
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      status: "CLOSED_TEMP",
      is_active: false,
      suspended_reason: `Từ chối yêu cầu xóa: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "DELETE_REQUESTED");

  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  revalidatePath("/host");
  revalidatePath("/host/list");
  revalidatePath("/homestays");
  redirectToProperties("delete_rejected");
}

export async function suspendProperty(formData: FormData) {
  const { supabase } = await getAdminClient();
  const id = getString(formData, "id");
  const reason = getString(formData, "reason") || "Quản trị viên khóa chỗ nghỉ.";

  if (!id) {
    redirect("/admin/properties?error=invalid");
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      status: "SUSPENDED",
      is_active: false,
      suspended_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  revalidatePath("/host");
  revalidatePath("/host/list");
  revalidatePath("/homestays");
  redirectToProperties("suspended");
}

export async function hideProperty(formData: FormData) {
  const form = new FormData();
  form.set("id", getString(formData, "id"));
  form.set("status", "HIDDEN");
  return updatePropertyStatus(form);
}

export async function reopenProperty(formData: FormData) {
  const form = new FormData();
  form.set("id", getString(formData, "id"));
  form.set("status", "APPROVED");
  return updatePropertyStatus(form);
}

async function countActiveBookings(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  propertyId: string,
) {
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("homestay_id", propertyId)
    .in("status", [...ACTIVE_BOOKING_STATUSES]);

  return count || 0;
}

export async function updateBookingStatus(formData: FormData) {
  const { supabase } = await getAdminClient();
  const id = getString(formData, "id");
  const status = getString(formData, "status");
  const reason = getString(formData, "reason");

  if (!id || !ALLOWED_BOOKING_STATUSES.has(status)) {
    redirect("/admin/bookings?error=invalid");
  }

  // Fetch current payment status to handle refund transitions
  const { data: currentBk } = await supabase
    .from("bookings")
    .select("payment_status")
    .eq("id", id)
    .single();

  const updateData: any = { status, updated_at: new Date().toISOString() };
  
  if (status === "CANCELLED") {
    if (reason) {
      updateData.cancel_reason = reason;
    }
    if (currentBk?.payment_status === "PAID") {
      updateData.payment_status = "REFUNDED";
    }
  }

  const { error } = await supabase.from("bookings").update(updateData).eq("id", id);
  if (error) {
    redirect("/admin/bookings?error=update_failed");
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/host/bookings");
  revalidatePath("/my-bookings");
  revalidatePath("/bookings");
  redirect("/admin/bookings?status=updated");
}

export async function updateReviewStatus(formData: FormData) {
  const { supabase } = await getAdminClient();
  const id = getString(formData, "id");
  const status = getString(formData, "status");

  if (!id || !ALLOWED_REVIEW_STATUSES.has(status)) {
    redirect("/admin/reviews?error=invalid");
  }

  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) {
    redirect("/admin/reviews?error=update_failed");
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/homestays");
  redirect("/admin/reviews?status=updated");
}

export async function updateUserRole(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");
  const role = getString(formData, "role") as AppRole;

  if (!id || !ALLOWED_ROLES.has(role)) {
    redirect("/admin/users?error=invalid");
  }

  if (id === user.id && role !== "ADMIN") {
    redirect("/admin/users?error=self_lock");
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) {
    redirect("/admin/users?error=update_failed");
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/partners");
  redirect("/admin/users?status=updated");
}

export async function updateUserStatus(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");
  const status = getString(formData, "status") as ProfileStatus;

  if (!id || !ALLOWED_PROFILE_STATUSES.has(status)) {
    redirect("/admin/users?error=invalid");
  }

  if (id === user.id && status === "BLOCKED") {
    redirect("/admin/users?error=self_lock");
  }

  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) {
    redirect("/admin/users?error=update_failed");
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/partners");
  redirect("/admin/users?status=updated");
}

export async function updateWebsiteSettings(formData: FormData) {
  const { supabase } = await getAdminClient();

  const site_name = getString(formData, "site_name");
  const hero_title = getString(formData, "hero_title");
  const hero_subtitle = getString(formData, "hero_subtitle");
  const featured_destinations = getString(formData, "featured_destinations");
  const property_types = getString(formData, "property_types");
  const default_amenities = getString(formData, "default_amenities");

  const { data: currentHeroRow } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", ["hero_image", "hero_image_path"]);

  const currentHeroImagePath =
    currentHeroRow?.find((row) => row.key === "hero_image_path")?.value || "";

  const payload: { key: string; value: string }[] = [
    { key: "site_name", value: site_name },
    { key: "hero_title", value: hero_title },
    { key: "hero_subtitle", value: hero_subtitle },
    { key: "featured_destinations", value: featured_destinations },
    { key: "property_types", value: property_types },
    { key: "default_amenities", value: default_amenities },
  ];

  // Handle hero image upload (optional)
  const heroFile = formData.get("hero_image");
  if (heroFile && heroFile instanceof File && heroFile.size > 0) {
    const extension = heroFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `site-hero/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(storagePath, heroFile, {
        cacheControl: "3600",
        contentType: heroFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data } = supabase.storage
        .from("site-assets")
        .getPublicUrl(storagePath);
      payload.push({ key: "hero_image", value: data.publicUrl });
      payload.push({ key: "hero_image_path", value: storagePath });

      if (currentHeroImagePath && currentHeroImagePath !== storagePath) {
        await supabase.storage
          .from("site-assets")
          .remove([currentHeroImagePath]);
      }
    }
  }

  const { error } = await supabase.from("site_settings").upsert(payload, {
    onConflict: "key",
  });

  if (error) {
    redirect("/admin/settings?error=update_failed");
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?status=updated");
}

export async function approveDeletePropertyAction(propertyId: string) {
  try {
    const { supabase, user } = await getAdminClient();
    if (!propertyId) return { error: "Thiếu ID chỗ nghỉ." };

    const activeBookings = await countActiveBookings(supabase, propertyId);
    if (activeBookings > 0) {
      return { error: "Chỗ nghỉ đang có đơn đặt phòng sắp tới. Không thể xóa." };
    }

    const { error } = await supabase
      .from("homestays")
      .update({
        status: "DELETED",
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId);

    if (error) return { error: "Không thể cập nhật trạng thái xóa." };

    revalidatePath("/admin/properties");
    revalidatePath("/admin");
    revalidatePath("/host");
    revalidatePath("/host/list");
    revalidatePath("/homestays");
    return { success: true, message: "Đã duyệt xóa chỗ nghỉ." };
  } catch (err: any) {
    return { error: err.message || "Lỗi phê duyệt xóa." };
  }
}

export async function rejectDeletePropertyAction(propertyId: string, adminNote?: string) {
  try {
    const { supabase } = await getAdminClient();
    if (!propertyId) return { error: "Thiếu ID chỗ nghỉ." };

    const { error } = await supabase
      .from("homestays")
      .update({
        status: "APPROVED",
        is_active: true,
        suspended_reason: adminNote ? `Từ chối yêu cầu xóa: ${adminNote}` : "Từ chối yêu cầu xóa.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", propertyId)
      .eq("status", "DELETE_REQUESTED");

    if (error) return { error: "Không thể từ chối yêu cầu xóa." };

    revalidatePath("/admin/properties");
    revalidatePath("/admin");
    revalidatePath("/host");
    revalidatePath("/host/list");
    revalidatePath("/homestays");
    return { success: true, message: "Đã từ chối yêu cầu xóa chỗ nghỉ." };
  } catch (err: any) {
    return { error: err.message || "Lỗi từ chối yêu cầu xóa." };
  }
}
