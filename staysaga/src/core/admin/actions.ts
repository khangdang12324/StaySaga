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

  revalidatePath("/admin/properties");
  revalidatePath("/host");
  revalidatePath("/homestays");
  redirectToProperties("updated");
}

export async function approveProperty(formData: FormData) {
  const { supabase, user } = await getAdminClient();
  const id = getString(formData, "id");

  if (!id) {
    redirect("/admin/properties?error=invalid");
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      status: "APPROVED",
      is_active: true,
      verification_status: "APPROVED",
      rejection_reason: null,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePath("/admin/properties");
  revalidatePath("/host");
  revalidatePath("/homestays");
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
  revalidatePath("/host");
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
  revalidatePath("/host");
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
  revalidatePath("/host");
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
  revalidatePath("/host");
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

  if (!id || !ALLOWED_BOOKING_STATUSES.has(status)) {
    redirect("/admin/bookings?error=invalid");
  }

  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) {
    redirect("/admin/bookings?error=update_failed");
  }

  revalidatePath("/admin/bookings");
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
  redirect("/admin/reviews?status=updated");
}
