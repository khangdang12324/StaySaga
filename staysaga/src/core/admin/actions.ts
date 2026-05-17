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

const ALLOWED_ROLES = new Set<AppRole>(["USER", "PARTNER", "ADMIN"]);
const ALLOWED_PROFILE_STATUSES = new Set<ProfileStatus>(["ACTIVE", "BLOCKED"]);
const ALLOWED_PROPERTY_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);
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
  const { supabase } = await getAdminClient();
  const id = getString(formData, "id");
  const status = getString(formData, "status");

  if (!id || !ALLOWED_PROPERTY_STATUSES.has(status)) {
    redirect("/admin/properties?error=invalid");
  }

  const { error } = await supabase
    .from("homestays")
    .update({ status, is_active: status === "APPROVED" })
    .eq("id", id);
  if (error) {
    redirect("/admin/properties?error=update_failed");
  }

  revalidatePath("/admin/properties");
  revalidatePath("/homestays");
  redirect("/admin/properties?status=updated");
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
