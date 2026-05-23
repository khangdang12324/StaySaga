"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  canAccessPartner,
  getProfileStatus,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { isPropertyStatus, type PropertyStatus } from "@/core/properties/status";

const IMAGE_BUCKET = "homestay-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export type HostListing = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  avg_rating: number;
  is_active: boolean;
  status?: PropertyStatus;
  rejection_reason?: string | null;
  delete_reason?: string | null;
  delete_requested_at?: string | null;
  delete_requested_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  suspended_reason?: string | null;
  created_at: string;
  homestay_images?: {
    id: string;
    url: string;
    storage_path: string | null;
  }[];
};

type HostDashboardData = {
  listings: HostListing[];
  totalRevenue: number;
  pendingBookings: number;
  averageRating: number;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function getOptionalNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function createSlug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${normalized || "homestay"}-${crypto.randomUUID().slice(0, 8)}`;
}

function redirectToHost(status: string): never {
  if (status === "created") {
    redirect("/host?status=created");
  }
  redirect(`/host?status=${status}`);
}

function redirectToHostError(error: string): never {
  redirect(`/host?error=${error}`);
}

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name:
        user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    },
    { onConflict: "id" },
  );

  return { supabase, user };
}

async function getCurrentPartner() {
  const { supabase, user } = await getCurrentUser();
  const authSupabase = supabase as unknown as SupabaseLike;
  const role = await getUserRole(authSupabase, user.id);
  const status = await getProfileStatus(authSupabase, user.id);

  if (status === "BLOCKED") {
    redirect("/");
  }

  if (!canAccessPartner(role)) {
    redirect("/host/onboard");
  }

  return { supabase, user, role };
}

async function getOwnedProperty(
  propertyId: string,
  userId: string,
  role: string,
) {
  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase
    .from("homestays")
    .select("id, owner_id, status, is_active")
    .eq("id", propertyId)
    .maybeSingle();

  if (error || !data) {
    redirectToHostError("not_found");
  }

  if (role !== "ADMIN" && data.owner_id !== userId) {
    redirectToHostError("forbidden");
  }

  return data as {
    id: string;
    owner_id: string;
    status: PropertyStatus | null;
    is_active: boolean | null;
  };
}

async function updateOwnedPropertyStatus(
  propertyId: string,
  payload: Record<string, string | boolean | null>,
) {
  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase
    .from("homestays")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    redirectToHostError("status_update_failed");
  }
}

async function uploadImage(
  supabase: SupabaseClient,
  userId: string,
  homestayId: string,
  file: File | null,
  sortOrder = 0,
  category = "gallery",
) {
  if (!file || file.size === 0) return null;

  if (!file.type.startsWith("image/")) {
    redirectToHostError("image_type");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    redirectToHostError("image_size");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${userId}/${homestayId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return null;
  }

  const { data } = supabase.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  const imagePayload = {
    homestay_id: homestayId,
    url: data.publicUrl,
    image_url: data.publicUrl,
    storage_path: storagePath,
    alt: file.name,
    is_cover: sortOrder === 0,
    sort_order: sortOrder,
    category,
  };

  let { error: imageError } = await supabase.from("homestay_images").insert(imagePayload);

  const imageErrorMessage = String(imageError?.message || "").toLowerCase();
  if (
    imageError &&
    ["storage_path", "image_url", "is_cover", "sort_order", "category"].some((column) =>
      imageErrorMessage.includes(column),
    )
  ) {
    const retry = await supabase.from("homestay_images").insert({
      homestay_id: homestayId,
      url: data.publicUrl,
      alt: file.name,
    });
    imageError = retry.error;
  }

  if (imageError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
    return null;
  }

  return data.publicUrl;
}

async function ensureImageBucket(supabase: SupabaseClient) {
  const { data } = await supabase.storage.getBucket(IMAGE_BUCKET);
  if (data) return;

  await supabase.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_SIZE,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });
}

async function insertHomestayWithFallback(
  supabase: Awaited<ReturnType<typeof createClient>> | SupabaseClient,
  payload: {
    owner_id: string;
    slug: string;
    name: string;
    description: string | null;
    address: string | null;
    city: string;
    country: string;
    price_per_night: number;
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    is_active: boolean;
    status: PropertyStatus;
  } & Record<string, unknown>,
) {
  let { data, error } = await supabase
    .from("homestays")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    const payloadWithoutStatus = {
      owner_id: payload.owner_id,
      slug: payload.slug,
      name: payload.name,
      description: payload.description,
      address: payload.address,
      city: payload.city,
      country: payload.country,
      price_per_night: payload.price_per_night,
      max_guests: payload.max_guests,
      bedrooms: payload.bedrooms,
      beds: payload.beds,
      bathrooms: payload.bathrooms,
      is_active: payload.is_active,
    };
    const retry = await supabase
      .from("homestays")
      .insert(payloadWithoutStatus)
      .select("id")
      .single();
    data = retry.data;
    error = retry.error;
  }

  return { data, error };
}

async function fetchHostListings(
  supabase: Awaited<ReturnType<typeof createClient>> | SupabaseClient,
  userId: string,
): Promise<HostListing[]> {
  const baseSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, created_at, homestay_images(id, url, storage_path)";
  const extendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, avg_rating, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, homestay_images(id, url, storage_path)";
  const noStorageExtendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, avg_rating, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, homestay_images(id, url)";
  
  // Omit avg_rating (since avg_rating is not a column on homestays table)
  const noRatingExtendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, homestay_images(id, url, storage_path)";
  const noRatingNoStorageExtendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, homestay_images(id, url)";

  const noStorageBaseSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, created_at, homestay_images(id, url)";
  const noRelationBaseSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, created_at";

  for (const select of [
    extendedSelect,
    noStorageExtendedSelect,
    noRatingExtendedSelect,
    noRatingNoStorageExtendedSelect,
    baseSelect,
    noStorageBaseSelect,
    noRelationBaseSelect,
  ]) {
    const result = await supabase
      .from("homestays")
      .select(select)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (!result.error) return (result.data || []) as unknown as HostListing[];
  }

  return [];
}

export async function getHostDashboardData(): Promise<HostDashboardData> {
  const { supabase, user } = await getCurrentPartner();

  let listings = await fetchHostListings(supabase, user.id);
  if (listings.length === 0) {
    const adminSupabase = await createAdminClient();
    listings = await fetchHostListings(adminSupabase, user.id);
  }

  const listingIds = (listings || []).map((listing) => listing.id);
  let totalRevenue = 0;
  let pendingBookings = 0;

  if (listingIds.length > 0) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("total_price, status")
      .in("homestay_id", listingIds);

    totalRevenue =
      bookings
        ?.filter((booking) => booking.status !== "CANCELLED")
        .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0) ||
      0;
    pendingBookings =
      bookings?.filter((booking) => booking.status === "PENDING").length || 0;
  }

  const normalizedListings = (listings || [])
    .map((listing) => {
      const row = listing as Partial<HostListing> & {
        price_per_night?: number | string;
        avg_rating?: number | string | null;
        status?: string | null;
      };
      const status = isPropertyStatus(row.status || "") ? row.status : "APPROVED";

      return {
        ...row,
        price_per_night: Number(row.price_per_night || 0),
        avg_rating: Number(row.avg_rating || 0),
        status,
      };
    })
    .filter((listing) => listing.status !== "DELETED") as HostListing[];

  const averageRating =
    normalizedListings.length > 0
      ? normalizedListings.reduce(
          (sum, listing) => sum + Number(listing.avg_rating || 0),
          0,
        ) / normalizedListings.length
      : 0;

  return {
    listings: normalizedListings,
    totalRevenue,
    pendingBookings,
    averageRating,
  };
}

async function upsertRoomForProperty(
  supabase: SupabaseClient,
  homestayId: string,
  room: Record<string, unknown>,
) {
  const { error } = await supabase.from("rooms").insert({
    homestay_id: homestayId,
    ...room,
  });

  if (error) {
    // Older Supabase databases may not have the rooms table yet. The migration
    // adds it; until it is applied, the main homestay record should still save.
    return;
  }
}

async function attachAmenities(
  supabase: SupabaseClient,
  homestayId: string,
  amenityNames: string[],
) {
  if (amenityNames.length === 0) return;

  for (const name of amenityNames) {
    const key = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");

    const { data: amenity } = await supabase
      .from("amenities")
      .upsert({ key, name }, { onConflict: "key" })
      .select("id")
      .single();

    if (!amenity?.id) continue;

    await supabase
      .from("homestay_amenities")
      .upsert({ homestay_id: homestayId, amenity_id: amenity.id });
  }
}

async function saveIncompleteHomestayDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
  name: string,
  city: string,
  price: number,
) {
  const draftPayload = {
    owner_id: userId,
    slug: createSlug(name),
    name,
    title: name,
    description: getString(formData, "description") || null,
    short_description: getString(formData, "short_description") || null,
    detailed_description:
      getString(formData, "detailed_description") ||
      getString(formData, "description") ||
      null,
    property_type: getString(formData, "property_type") || "homestay",
    address: getString(formData, "address") || null,
    city,
    district: getString(formData, "district") || null,
    country: getString(formData, "country") || "Vietnam",
    latitude: getOptionalNumber(formData, "latitude"),
    longitude: getOptionalNumber(formData, "longitude"),
    price_per_night: price,
    base_price_per_night: price,
    max_guests: Math.max(1, getNumber(formData, "max_guests", 2)),
    bedrooms: Math.max(0, getNumber(formData, "bedrooms", 1)),
    beds: Math.max(1, getNumber(formData, "beds", 1)),
    bathrooms: Math.max(0, getNumber(formData, "bathrooms", 1)),
    owner_name: getString(formData, "owner_name") || getString(formData, "host_name") || null,
    contact_phone: getString(formData, "contact_phone") || null,
    contact_email: getString(formData, "contact_email") || null,
    registration_checklist: {
      basic: Boolean(name && getString(formData, "description")),
      location: Boolean(city && getString(formData, "address")),
      images: false,
      rooms: price > 0,
      pricing: price > 0,
      amenities: Boolean(getString(formData, "amenities")),
      policies: true,
    },
    rejection_reason: "Cần ít nhất 1 ảnh đại diện trước khi gửi duyệt.",
    is_active: false,
    status: "DRAFT" as const,
  };

  const propertyId = getString(formData, "id");
  const adminSupabase = await createAdminClient();

  let result;
  if (propertyId) {
    const updateResult = await supabase
      .from("homestays")
      .update(draftPayload)
      .eq("id", propertyId)
      .eq("owner_id", userId)
      .select("id")
      .single();
    result =
      updateResult.error || !updateResult.data
        ? await adminSupabase
            .from("homestays")
            .update(draftPayload)
            .eq("id", propertyId)
            .eq("owner_id", userId)
            .select("id")
            .single()
        : updateResult;
  } else {
    const insertResult = await insertHomestayWithFallback(supabase, draftPayload);
    result =
      insertResult.error || !insertResult.data
        ? await insertHomestayWithFallback(adminSupabase, draftPayload)
        : insertResult;
  }

  if (result.error || !result.data) {
    redirectToHostError("create_failed");
  }

  revalidatePath("/host");
  revalidatePath("/host/list");
}

export async function createHostHomestay(formData: FormData) {
  const { supabase, user } = await getCurrentPartner();
  const name = getString(formData, "name");
  const city = getString(formData, "city");
  const price = getNumber(formData, "price_per_night") || getNumber(formData, "base_price_per_night");

  if (!name || !city || price <= 0) {
    redirectToHostError("invalid");
  }

  const imageFiles = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);
  const fallbackImage = formData.get("image");
  const filesToUpload =
    imageFiles.length > 0
      ? imageFiles
      : fallbackImage instanceof File && fallbackImage.size > 0
        ? [fallbackImage]
        : [];

  if (filesToUpload.length < 1) {
    await saveIncompleteHomestayDraft(supabase, user.id, formData, name, city, price);
    redirectToHostError("image_count");
  }

  for (const file of filesToUpload) {
    if (!file.type.startsWith("image/")) {
      redirectToHostError("image_type");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      redirectToHostError("image_size");
    }
  }

  const maxGuests = Math.max(1, getNumber(formData, "max_guests", 2));
  const bedrooms = Math.max(0, getNumber(formData, "bedrooms", 1));
  const beds = Math.max(1, getNumber(formData, "beds", 1));
  const bathrooms = Math.max(0, getNumber(formData, "bathrooms", 1));
  const roomName = getString(formData, "room_name") || `${name} - loại căn chính`;
  const amenities = getString(formData, "amenities")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const policies = {
    checkInFrom: getString(formData, "check_in_from") || "15:00",
    checkInTo: getString(formData, "check_in_to") || "18:00",
    checkOutFrom: getString(formData, "check_out_from") || "08:00",
    checkOutTo: getString(formData, "check_out_to") || "11:00",
    freeCancellation: getBoolean(formData, "free_cancellation"),
    noPrepayment: getBoolean(formData, "no_prepayment"),
    noCreditCard: getBoolean(formData, "no_credit_card"),
    allowChildren: getBoolean(formData, "allow_children"),
    allowSmoking: getBoolean(formData, "allow_smoking"),
    allowParties: getBoolean(formData, "allow_parties"),
    allowPets: getBoolean(formData, "allow_pets"),
  };
  const checklist = {
    basic: Boolean(name && getString(formData, "description")),
    location: Boolean(city && getString(formData, "address")),
    images: filesToUpload.length >= 1,
    rooms: Boolean(roomName && price > 0),
    pricing: price > 0,
    amenities: amenities.length > 0,
    policies: true,
  };

  const payload = {
    owner_id: user.id,
    slug: createSlug(name),
    name,
    title: name,
    description: getString(formData, "description") || null,
    short_description: getString(formData, "short_description") || null,
    detailed_description: getString(formData, "detailed_description") || getString(formData, "description") || null,
    property_type: getString(formData, "property_type") || "homestay",
    address: getString(formData, "address") || null,
    city,
    district: getString(formData, "district") || null,
    country: getString(formData, "country") || "Vietnam",
    latitude: getOptionalNumber(formData, "latitude"),
    longitude: getOptionalNumber(formData, "longitude"),
    directions_note: getString(formData, "directions_note") || null,
    location_note: getString(formData, "directions_note") || null,
    price_per_night: price,
    base_price_per_night: price,
    max_guests: maxGuests,
    bedrooms,
    beds,
    bathrooms,
    area_sqm: getOptionalNumber(formData, "area_sqm"),
    area_m2: getOptionalNumber(formData, "area_sqm"),
    weekend_price: getOptionalNumber(formData, "weekend_price"),
    sale_start_date: getString(formData, "sale_start_date") || null,
    sale_end_date: getString(formData, "sale_end_date") || null,
    available_from: getString(formData, "sale_start_date") || null,
    available_to: getString(formData, "sale_end_date") || null,
    min_nights: Math.max(1, getNumber(formData, "min_nights", 1)),
    available_units: Math.max(1, getNumber(formData, "available_units", 1)),
    booking_mode: getBoolean(formData, "instant_booking") ? "INSTANT" : "REQUEST",
    instant_book: getBoolean(formData, "instant_booking"),
    verification_status: "PENDING",
    owner_name: getString(formData, "owner_name") || getString(formData, "host_name") || null,
    contact_phone: getString(formData, "contact_phone") || null,
    contact_email: getString(formData, "contact_email") || user.email || null,
    verification_note: getString(formData, "verification_note") || null,
    policies,
    check_in_from: policies.checkInFrom,
    check_in_to: policies.checkInTo,
    check_out_from: policies.checkOutFrom,
    check_out_to: policies.checkOutTo,
    free_cancellation: policies.freeCancellation,
    no_prepayment: policies.noPrepayment,
    no_credit_card: policies.noCreditCard,
    allow_children: policies.allowChildren,
    allow_smoking: policies.allowSmoking,
    allow_party: policies.allowParties,
    allow_pets: policies.allowPets,
    house_rules: getString(formData, "house_rules") || null,
    registration_checklist: checklist,
    submitted_at: new Date().toISOString(),
    rejection_reason: null,
    is_active: false,
    status: "PENDING" as const,
  };

  const propertyId = getString(formData, "id");
  let data = null;
  let error = null;

  const adminSupabase = await createAdminClient();
  if (propertyId) {
    const updateResult = await supabase
      .from("homestays")
      .update(payload)
      .eq("id", propertyId)
      .eq("owner_id", user.id)
      .select("id")
      .single();
    if (updateResult.error || !updateResult.data) {
      const adminUpdate = await adminSupabase
        .from("homestays")
        .update(payload)
        .eq("id", propertyId)
        .eq("owner_id", user.id)
        .select("id")
        .single();
      data = adminUpdate.data;
      error = adminUpdate.error;
    } else {
      data = updateResult.data;
      error = updateResult.error;
    }
  } else {
    const insertResult = await insertHomestayWithFallback(supabase, payload);
    if (insertResult.error || !insertResult.data) {
      const adminInsert = await insertHomestayWithFallback(adminSupabase, payload);
      data = adminInsert.data;
      error = adminInsert.error;
    } else {
      data = insertResult.data;
      error = insertResult.error;
    }
  }

  if (error || !data) {
    redirectToHostError("create_failed");
  }

  await ensureImageBucket(adminSupabase);
  await Promise.all(
    filesToUpload
      .slice(0, 8)
      .map((file, index) => uploadImage(adminSupabase, user.id, data.id, file, index, index === 0 ? "cover" : "gallery")),
  );

  await upsertRoomForProperty(adminSupabase, data.id, {
    name: roomName,
    max_guests: maxGuests,
    bed_type: getString(formData, "bed_type") || "double",
    bed_count: Math.max(1, getNumber(formData, "bed_count", beds)),
    bathroom_count: bathrooms,
    private_bathroom: getBoolean(formData, "private_bathroom"),
    price_per_night: price,
    quantity: Math.max(1, getNumber(formData, "room_quantity", getNumber(formData, "available_units", 1))),
    status: "ACTIVE",
  });

  await attachAmenities(adminSupabase, data.id, amenities);

  revalidatePath("/host");
  revalidatePath("/host/list");
  revalidatePath("/admin/properties");
  revalidatePath("/homestays");
  redirectToHost("created");
}

export async function createDraftProperty(formData: FormData) {
  const { supabase, user } = await getCurrentPartner();
  const name = getString(formData, "name") || "Chỗ nghỉ chưa đặt tên";
  const city = getString(formData, "city") || "Việt Nam";

  const payload = {
    owner_id: user.id,
    slug: createSlug(name),
    name,
    title: name,
    description: getString(formData, "description") || null,
    address: getString(formData, "address") || null,
    city,
    country: getString(formData, "country") || "Vietnam",
    price_per_night: Math.max(0, getNumber(formData, "price_per_night", 0)),
    max_guests: Math.max(1, getNumber(formData, "max_guests", 2)),
    bedrooms: Math.max(0, getNumber(formData, "bedrooms", 1)),
    beds: Math.max(0, getNumber(formData, "beds", 1)),
    bathrooms: Math.max(0, getNumber(formData, "bathrooms", 1)),
    is_active: false,
    status: "DRAFT" as const,
  };

  const adminSupabase = await createAdminClient();
  const { data, error } = await insertHomestayWithFallback(supabase, payload);
  const result = error || !data ? await insertHomestayWithFallback(adminSupabase, payload) : { data, error };

  if (result.error || !result.data) {
    redirectToHostError("create_failed");
  }

  revalidatePath("/host");
  redirect(`/host/register?propertyId=${result.data.id}`);
}

export async function saveDatabaseDraftAction(draftJson: string) {
  const { supabase, user } = await getCurrentPartner();
  const draft = JSON.parse(draftJson);
  
  const name = draft.name || "Chỗ nghỉ chưa đặt tên";
  const city = draft.city || "Việt Nam";
  const price = Number(draft.price || 0);

  const payload: any = {
    owner_id: user.id,
    slug: createSlug(name) + (draft.id ? "" : `-${Math.random().toString(36).substring(2, 6)}`),
    name,
    title: name,
    description: draft.description || null,
    property_type: draft.propertyType || "homestay",
    address: draft.address || null,
    city,
    district: draft.district || null,
    country: draft.country || "Vietnam",
    price_per_night: price,
    base_price_per_night: price,
    max_guests: Math.max(1, Number(draft.maxGuests || 2)),
    bedrooms: Math.max(0, draft.bedrooms?.length || 1),
    beds: Math.max(1, draft.bedrooms?.reduce((sum: number, r: any) => sum + Number(r.double || 0) * 2 + Number(r.single || 0) + Number(r.sofa || 0), 0) || 1),
    bathrooms: Math.max(0, Number(draft.bathrooms || 1)),
    is_active: false,
    status: "DRAFT" as const,
    registration_checklist: {
      currentStep: draft.currentStep || 0,
      draftState: draft,
      basic: Boolean(name && draft.description),
      location: Boolean(city && draft.address),
      images: false,
      rooms: price > 0,
      pricing: price > 0,
      amenities: (draft.amenities?.length || 0) > 0,
      policies: true,
    },
  };

  if (draft.latitude) payload.latitude = Number(draft.latitude);
  if (draft.longitude) payload.longitude = Number(draft.longitude);

  const adminSupabase = await createAdminClient();
  
  let result;
  if (draft.id) {
    const { data, error } = await supabase
      .from("homestays")
      .update(payload)
      .eq("id", draft.id)
      .eq("owner_id", user.id)
      .select("id")
      .single();
      
    result = error || !data ? await adminSupabase
      .from("homestays")
      .update(payload)
      .eq("id", draft.id)
      .eq("owner_id", user.id)
      .select("id")
      .single() : { data, error };
  } else {
    result = await insertHomestayWithFallback(supabase, payload);
    if (result.error || !result.data) {
      result = await insertHomestayWithFallback(adminSupabase, payload);
    }
  }

  if (result.error || !result.data) {
    return { error: "Failed to save draft" };
  }

  revalidatePath("/host");
  revalidatePath("/host/list");
  return { id: result.data.id };
}

export async function updatePropertyType(formData: FormData) {
  const id = getString(formData, "id");
  const propertyType = getString(formData, "property_type");
  if (!id || !propertyType) redirectToHostError("invalid");

  return updateMyPropertyPayload(id, formData, {
    property_type: propertyType,
  });
}

async function updateMyPropertyPayload(
  propertyId: string,
  formData: FormData,
  payload: Record<string, unknown>,
) {
  const { user, role } = await getCurrentPartner();
  await getOwnedProperty(propertyId, user.id, role);

  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase
    .from("homestays")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    redirectToHostError("update_failed");
  }

  const next = getString(formData, "next") || `/host/${propertyId}`;
  revalidatePath("/host");
  revalidatePath(`/host/${propertyId}`);
  redirect(next);
}

export async function updatePropertyBasicInfo(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");

  return updateMyPropertyPayload(id, formData, {
    name: getString(formData, "name"),
    title: getString(formData, "name"),
    description: getString(formData, "description") || null,
    short_description: getString(formData, "short_description") || null,
    detailed_description: getString(formData, "detailed_description") || null,
    property_type: getString(formData, "property_type") || null,
    max_guests: Math.max(1, getNumber(formData, "max_guests", 2)),
    bedrooms: Math.max(0, getNumber(formData, "bedrooms", 1)),
    bathrooms: Math.max(0, getNumber(formData, "bathrooms", 1)),
    area_sqm: getOptionalNumber(formData, "area_sqm"),
    area_m2: getOptionalNumber(formData, "area_sqm"),
  });
}

export async function updatePropertyLocation(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");

  return updateMyPropertyPayload(id, formData, {
    city: getString(formData, "city"),
    district: getString(formData, "district") || null,
    address: getString(formData, "address") || null,
    latitude: getOptionalNumber(formData, "latitude"),
    longitude: getOptionalNumber(formData, "longitude"),
    directions_note: getString(formData, "directions_note") || null,
    location_note: getString(formData, "directions_note") || null,
  });
}

export async function uploadPropertyImages(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");
  await getOwnedProperty(id, user.id, role);

  const files = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const adminSupabase = await createAdminClient();
  await ensureImageBucket(adminSupabase);
  await Promise.all(files.map((file, index) => uploadImage(adminSupabase, user.id, id, file, index)));

  revalidatePath("/host");
  revalidatePath(`/host/${id}`);
  redirect(`/host/${id}?status=updated`);
}

export async function deletePropertyImage(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const propertyId = getString(formData, "property_id");
  const imageId = getString(formData, "image_id");
  if (!propertyId || !imageId) redirectToHostError("invalid");
  await getOwnedProperty(propertyId, user.id, role);

  const adminSupabase = await createAdminClient();
  const { data } = await adminSupabase
    .from("homestay_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("homestay_id", propertyId)
    .maybeSingle();

  const { error } = await adminSupabase
    .from("homestay_images")
    .delete()
    .eq("id", imageId)
    .eq("homestay_id", propertyId);

  if (error) redirectToHostError("update_failed");
  if (data?.storage_path) {
    await adminSupabase.storage.from(IMAGE_BUCKET).remove([data.storage_path]);
  }

  revalidatePath(`/host/${propertyId}`);
  redirect(`/host/${propertyId}?status=updated`);
}

export async function setCoverImage(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const propertyId = getString(formData, "property_id");
  const imageId = getString(formData, "image_id");
  if (!propertyId || !imageId) redirectToHostError("invalid");
  await getOwnedProperty(propertyId, user.id, role);

  const adminSupabase = await createAdminClient();
  await adminSupabase.from("homestay_images").update({ is_cover: false }).eq("homestay_id", propertyId);
  const { error } = await adminSupabase
    .from("homestay_images")
    .update({ is_cover: true, sort_order: 0 })
    .eq("id", imageId)
    .eq("homestay_id", propertyId);

  if (error) redirectToHostError("update_failed");
  revalidatePath(`/host/${propertyId}`);
  redirect(`/host/${propertyId}?status=updated`);
}

export async function updatePropertyRooms(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");
  await getOwnedProperty(id, user.id, role);

  const adminSupabase = await createAdminClient();
  await upsertRoomForProperty(adminSupabase, id, {
    name: getString(formData, "room_name") || "Loại phòng chính",
    max_guests: Math.max(1, getNumber(formData, "room_max_guests", 2)),
    bed_type: getString(formData, "bed_type") || "double",
    bed_count: Math.max(1, getNumber(formData, "bed_count", 1)),
    bathroom_count: Math.max(0, getNumber(formData, "bathroom_count", 1)),
    private_bathroom: getBoolean(formData, "private_bathroom"),
    price_per_night: Math.max(0, getNumber(formData, "room_price_per_night", 0)),
    quantity: Math.max(1, getNumber(formData, "room_quantity", 1)),
    status: "ACTIVE",
  });

  revalidatePath(`/host/${id}`);
  redirect(`/host/${id}?status=updated`);
}

export async function upsertPropertyRoom(formData: FormData) {
  return updatePropertyRooms(formData);
}

export async function deletePropertyRoom(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const propertyId = getString(formData, "property_id");
  const roomId = getString(formData, "room_id");
  if (!propertyId || !roomId) redirectToHostError("invalid");
  await getOwnedProperty(propertyId, user.id, role);

  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase
    .from("rooms")
    .update({ status: "DELETED", updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .eq("homestay_id", propertyId);

  if (error) redirectToHostError("update_failed");
  revalidatePath(`/host/${propertyId}`);
  redirect(`/host/${propertyId}?status=updated`);
}

export async function updatePropertyPricing(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");
  const price = getNumber(formData, "base_price_per_night");

  return updateMyPropertyPayload(id, formData, {
    price_per_night: price,
    base_price_per_night: price,
    weekend_price: getOptionalNumber(formData, "weekend_price"),
    sale_start_date: getString(formData, "sale_start_date") || null,
    sale_end_date: getString(formData, "sale_end_date") || null,
    available_from: getString(formData, "sale_start_date") || null,
    available_to: getString(formData, "sale_end_date") || null,
    min_nights: Math.max(1, getNumber(formData, "min_nights", 1)),
    available_units: Math.max(1, getNumber(formData, "available_units", 1)),
    booking_mode: getBoolean(formData, "instant_booking") ? "INSTANT" : "REQUEST",
    instant_book: getBoolean(formData, "instant_booking"),
  });
}

export async function updatePropertyAmenities(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");
  await getOwnedProperty(id, user.id, role);
  const amenities = getString(formData, "amenities").split(",").map((item) => item.trim()).filter(Boolean);
  await attachAmenities(await createAdminClient(), id, amenities);
  revalidatePath(`/host/${id}`);
  redirect(`/host/${id}?status=updated`);
}

export async function updatePropertyPolicies(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");

  const policies = {
    checkInFrom: getString(formData, "check_in_from"),
    checkInTo: getString(formData, "check_in_to"),
    checkOutFrom: getString(formData, "check_out_from"),
    checkOutTo: getString(formData, "check_out_to"),
    freeCancellation: getBoolean(formData, "free_cancellation"),
    noPrepayment: getBoolean(formData, "no_prepayment"),
    noCreditCard: getBoolean(formData, "no_credit_card"),
    allowChildren: getBoolean(formData, "allow_children"),
    allowSmoking: getBoolean(formData, "allow_smoking"),
    allowParties: getBoolean(formData, "allow_parties"),
    allowPets: getBoolean(formData, "allow_pets"),
    cancellationPolicy: getString(formData, "cancellation_policy") || null,
    paymentPolicy: getString(formData, "payment_policy") || null,
    houseRules: getString(formData, "house_rules") || null,
  };

  return updateMyPropertyPayload(id, formData, {
    policies,
    check_in_from: policies.checkInFrom,
    check_in_to: policies.checkInTo,
    check_out_from: policies.checkOutFrom,
    check_out_to: policies.checkOutTo,
    free_cancellation: policies.freeCancellation,
    no_prepayment: policies.noPrepayment,
    no_credit_card: policies.noCreditCard,
    allow_children: policies.allowChildren,
    allow_smoking: policies.allowSmoking,
    allow_party: policies.allowParties,
    allow_pets: policies.allowPets,
    house_rules: policies.houseRules,
  });
}

export async function updatePropertyVerification(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");

  return updateMyPropertyPayload(id, formData, {
    owner_name: getString(formData, "owner_name"),
    contact_phone: getString(formData, "contact_phone"),
    contact_email: getString(formData, "contact_email"),
    verification_note: getString(formData, "verification_note") || null,
    verification_status: "PENDING",
  });
}

export async function submitPropertyForReview(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");
  if (!id) redirectToHostError("invalid");
  await getOwnedProperty(id, user.id, role);

  const adminSupabase = await createAdminClient();
  const { data } = await adminSupabase
    .from("homestays")
    .select("name, city, address, price_per_night, owner_name, contact_phone, contact_email")
    .eq("id", id)
    .single();

  if (!data?.name || !data.city || !data.address || Number(data.price_per_night || 0) <= 0) {
    redirectToHostError("invalid");
  }

  const [{ count: imageCount }, { count: roomCount }] = await Promise.all([
    adminSupabase.from("homestay_images").select("id", { count: "exact", head: true }).eq("homestay_id", id),
    adminSupabase.from("rooms").select("id", { count: "exact", head: true }).eq("homestay_id", id).neq("status", "DELETED"),
  ]);

  if (!imageCount || imageCount < 1 || !roomCount || roomCount < 1) {
    redirectToHostError("checklist_incomplete");
  }

  if (!data.owner_name || !data.contact_phone || !data.contact_email) {
    redirectToHostError("verification_incomplete");
  }

  const { error } = await adminSupabase
    .from("homestays")
    .update({
      status: "PENDING",
      is_active: false,
      verification_status: "PENDING",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) redirectToHostError("update_failed");

  revalidatePath("/host");
  revalidatePath("/admin/properties");
  redirect("/host?status=created");
}

export async function updateHostHomestay(formData: FormData) {
  const { supabase, user } = await getCurrentPartner();
  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const city = getString(formData, "city");
  const price = getNumber(formData, "price_per_night");

  if (!id || !name || !city || price <= 0) {
    redirectToHostError("invalid");
  }

  const { error } = await supabase
    .from("homestays")
    .update({
      name,
      description: getString(formData, "description") || null,
      address: getString(formData, "address") || null,
      city,
      country: getString(formData, "country") || "Vietnam",
      price_per_night: price,
      max_guests: Math.max(1, getNumber(formData, "max_guests", 2)),
      bedrooms: Math.max(0, getNumber(formData, "bedrooms", 1)),
      beds: Math.max(0, getNumber(formData, "beds", 1)),
      bathrooms: Math.max(0, getNumber(formData, "bathrooms", 1)),
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirectToHostError("update_failed");
  }

  const image = formData.get("image");
  await uploadImage(
    supabase,
    user.id,
    id,
    image instanceof File ? image : null,
  );

  revalidatePath("/host");
  revalidatePath("/homestays");
  redirectToHost("updated");
}

export async function closeMyPropertyTemporarily(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");

  if (!id) {
    redirectToHostError("invalid");
  }

  const property = await getOwnedProperty(id, user.id, role);
  if (property.status === "SUSPENDED" || property.status === "DELETED") {
    redirectToHostError("blocked_property");
  }

  await updateOwnedPropertyStatus(id, {
    status: "CLOSED_TEMP",
    is_active: false,
  });

  revalidatePath("/host");
  revalidatePath(`/host/${id}`);
  revalidatePath("/homestays");
  redirect(`/host/${id}?status=closed`);
}

export async function reopenMyProperty(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");

  if (!id) {
    redirectToHostError("invalid");
  }

  const property = await getOwnedProperty(id, user.id, role);
  if (property.status === "SUSPENDED" || property.status === "DELETED") {
    redirectToHostError("blocked_property");
  }
  if (property.status === "DELETE_REQUESTED") {
    redirectToHostError("delete_pending");
  }

  await updateOwnedPropertyStatus(id, {
    status: "APPROVED",
    is_active: true,
  });

  revalidatePath("/host");
  revalidatePath(`/host/${id}`);
  revalidatePath("/homestays");
  redirect(`/host/${id}?status=opened`);
}

export async function requestDeleteMyProperty(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");
  const reason = getString(formData, "reason");
  const confirmed = formData.get("confirm_delete_request") === "on";

  if (!id || reason.length < 10 || !confirmed) {
    redirectToHostError("delete_request_invalid");
  }

  const property = await getOwnedProperty(id, user.id, role);
  if (property.status === "SUSPENDED" || property.status === "DELETED") {
    redirectToHostError("blocked_property");
  }
  if (property.status === "DELETE_REQUESTED") {
    redirectToHostError("delete_pending");
  }

  await updateOwnedPropertyStatus(id, {
    status: "DELETE_REQUESTED",
    is_active: false,
    delete_reason: reason,
    delete_requested_by: user.id,
    delete_requested_at: new Date().toISOString(),
  });

  revalidatePath("/host");
  revalidatePath(`/host/${id}`);
  revalidatePath("/homestays");
  redirect(`/host/${id}?status=delete_requested`);
}

export async function deleteHostHomestay(formData: FormData) {
  return requestDeleteMyProperty(formData);
}

export async function promoteToHost() {
  const { supabase, user } = await getCurrentUser();
  const adminSupabase = await createAdminClient();

  const { error } = await adminSupabase
    .from("profiles")
    .update({ role: "PARTNER" })
    .eq("id", user.id);

  if (error) {
    const { error: fallbackError } = await supabase
      .from("profiles")
      .update({ role: "PARTNER" })
      .eq("id", user.id);

    if (fallbackError) {
      redirect("/host/onboard?error=partner_failed");
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/host");
  redirect("/host/register");
}
