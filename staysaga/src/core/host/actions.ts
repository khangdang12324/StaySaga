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
  property_type?: string | null;
  owner_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  created_at: string;
  registration_checklist?: {
    currentStep?: number;
    completedSteps?: Record<string, boolean>;
    updatedAt?: string;
    draftState?: any;
    images?: boolean;
    basic?: boolean;
    location?: boolean;
    rooms?: boolean;
    pricing?: boolean;
    amenities?: boolean;
    policies?: boolean;
  } | null;
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
    storage_path: storagePath,
    is_primary: sortOrder === 0,
    sort_order: sortOrder,
  };

  let { error: imageError } = await supabase.from("homestay_images").insert(imagePayload);

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
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, created_at, registration_checklist, homestay_images(id, url, storage_path)";
  const extendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, avg_rating, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, registration_checklist, homestay_images(id, url, storage_path)";
  const noStorageExtendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, avg_rating, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, registration_checklist, homestay_images(id, url)";
  
  // Omit avg_rating (since avg_rating is not a column on homestays table)
  const noRatingExtendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, registration_checklist, homestay_images(id, url, storage_path)";
  const noRatingNoStorageExtendedSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, status, rejection_reason, delete_reason, delete_requested_at, delete_requested_by, deleted_at, deleted_by, suspended_reason, created_at, registration_checklist, homestay_images(id, url)";

  const noStorageBaseSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, created_at, registration_checklist, homestay_images(id, url)";
  const noRelationBaseSelect =
    "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, is_active, created_at, registration_checklist";

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

  const adminSupabase = await createAdminClient();
  const listings = await fetchHostListings(adminSupabase, user.id);

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
    console.warn("Primary rooms insert failed, attempting basic fallback query. Error detail:", error.message);
    const fallbackRoom: Record<string, any> = {
      homestay_id: homestayId,
      name: room.name,
      max_guests: room.max_guests,
      price_per_night: room.price_per_night,
    };
    if (room.status) {
      fallbackRoom.status = room.status;
    }
    const { error: fallbackError } = await supabase.from("rooms").insert(fallbackRoom);
    if (fallbackError) {
      console.error("Fallback rooms insert also failed:", fallbackError);
    }
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

  const adminSupabase = await createAdminClient();

  // Read existing checklist to preserve images flag and max currentStep
  let existingChecklistObj: Record<string, any> = {};
  let existingImages = false;
  let existingSavedStep = 0;
  let existingCompletedSteps: Record<string, boolean> = {};
  if (draft.id) {
    const { data: existing } = await adminSupabase
      .from("homestays")
      .select("registration_checklist")
      .eq("id", draft.id)
      .maybeSingle();
    const ec = existing?.registration_checklist as Record<string, unknown> | null;
    if (ec) {
      existingChecklistObj = ec;
      existingImages = ec.images === true;
      existingSavedStep = Number(ec.currentStep || 0);
      existingCompletedSteps = (ec.completedSteps as Record<string, boolean>) || {};
    }
  }

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
      ...existingChecklistObj,
      currentStep: Math.max(draft.currentStep || 0, existingSavedStep),
      draftState: draft,
      completedSteps: {
        ...existingCompletedSteps,
      },
      updatedAt: new Date().toISOString(),
      basic: Boolean(name && draft.description) || existingCompletedSteps.basicInfo === true || existingChecklistObj.basic === true,
      location: Boolean(city && draft.address) || existingCompletedSteps.address === true || existingChecklistObj.location === true,
      // Preserve images:true once set by savePhotosStepAction
      images: existingImages || (draft.currentStep || 0) > 13 || existingCompletedSteps.photos === true || existingChecklistObj.images === true,
      rooms: price > 0 || existingCompletedSteps.rooms === true || existingChecklistObj.rooms === true,
      pricing: price > 0 || existingCompletedSteps.price === true || existingChecklistObj.pricing === true,
      amenities: (draft.amenities?.length || 0) > 0 || existingCompletedSteps.amenities === true || existingChecklistObj.amenities === true,
      policies: true,
    },
  };

  if (draft.latitude) payload.latitude = Number(draft.latitude);
  if (draft.longitude) payload.longitude = Number(draft.longitude);


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

/**
 * Called by the wizard when the user successfully passes the photos step.
 * Uploads all provided image Files to Supabase Storage and marks
 * registration_checklist.images = true so the dashboard shows the correct
 * progress % and resume step.
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    // PNG
    if (buffer.readUInt32BE(0) === 0x89504E47 && buffer.readUInt32BE(4) === 0x0D0A1A0A) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG
    if (buffer.readUInt16BE(0) === 0xFFD8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        const isSOF = (marker >= 0xFFC0 && marker <= 0xFFC3) || 
                      (marker >= 0xFFC5 && marker <= 0xFFC7) || 
                      (marker >= 0xFFC9 && marker <= 0xFFCB) || 
                      (marker >= 0xFFCD && marker <= 0xFFCF);
        if (isSOF) {
          offset += 2; // skip length
          offset += 1; // skip data precision
          const height = buffer.readUInt16BE(offset);
          offset += 2;
          const width = buffer.readUInt16BE(offset);
          return { width, height };
        } else {
          if (offset + 2 > buffer.length) break;
          const length = buffer.readUInt16BE(offset);
          offset += length;
        }
      }
    }

    // WEBP
    if (buffer.readUInt32BE(0) === 0x52494646 && buffer.readUInt32BE(8) === 0x57454250) {
      const type = buffer.toString("ascii", 12, 16);
      if (type === "VP8 ") {
        const width = buffer.readUInt16LE(26) & 0x3FFF;
        const height = buffer.readUInt16LE(28) & 0x3FFF;
        return { width, height };
      } else if (type === "VP8L") {
        const val = buffer.readUInt32LE(21);
        const width = (val & 0x3FFF) + 1;
        const height = ((val >> 14) & 0x3FFF) + 1;
        return { width, height };
      } else if (type === "VP8X") {
        const width = buffer.readUIntLE(24, 3) + 1;
        const height = buffer.readUIntLE(27, 3) + 1;
        return { width, height };
      }
    }
  } catch (e) {
    console.error("Error reading image dimensions from buffer", e);
  }
  return null;
}

/**
 * Called by the wizard when uploading a single photo.
 * Validates file type, size, and dimensions, then uploads to storage and inserts to DB.
 */
export async function savePhotosStepAction(formData: FormData) {
  try {
    const { supabase, user } = await getCurrentPartner();
    const propertyId = formData.get("property_id") as string | null;
    const file = formData.get("image") as File | null;
    const sortOrder = Number(formData.get("sort_order") || 0);
    const category = (formData.get("category") as string) || "gallery";

    if (!propertyId) {
      return { error: "Không tìm thấy mã chỗ nghỉ." };
    }
    if (!file || file.size === 0) {
      return { error: "Không có file ảnh được gửi lên." };
    }

    // 1. Validate Mime Type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      return { error: "Định dạng ảnh không hợp lệ. Chỉ chấp nhận các định dạng JPG, JPEG, PNG, WEBP." };
    }

    // 2. Validate Size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { error: "Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn." };
    }

    // 3. Validate Dimensions (min 800x600)
    const buffer = Buffer.from(await file.arrayBuffer());
    const dims = getImageDimensions(buffer);
    if (dims) {
      if (dims.width < 800 || dims.height < 600) {
        return { error: `Kích thước ảnh quá nhỏ (${dims.width}x${dims.height}). Tối thiểu phải là 800x600 pixels.` };
      }
    }

    const adminSupabase = await createAdminClient();
    
    // Check if bucket exists
    const { data: bucketData, error: bucketError } = await adminSupabase.storage.getBucket(IMAGE_BUCKET);
    if (bucketError || !bucketData) {
      // Try to create the bucket
      const { error: createBucketError } = await adminSupabase.storage.createBucket(IMAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
      });
      if (createBucketError) {
        console.error("[Storage Bucket Error]", createBucketError);
        return { error: "Bucket ảnh chưa được tạo." };
      }
    }

    // Upload to Supabase Storage
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${user.id}/${propertyId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await adminSupabase.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]", uploadError);
      const msg = String(uploadError.message).toLowerCase();
      if (uploadError.statusCode === "42501" || msg.includes("permission") || msg.includes("policy")) {
        return { error: "Bạn không có quyền tải ảnh." };
      }
      return { error: `Không thể tải ảnh lên hệ thống lưu trữ: ${uploadError.message}` };
    }

    const { data } = adminSupabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(storagePath);

    const imagePayload = {
      homestay_id: propertyId,
      url: data.publicUrl,
      storage_path: storagePath,
      is_primary: sortOrder === 0,
      sort_order: sortOrder,
    };

    const { data: insertedData, error: imageError } = await adminSupabase
      .from("homestay_images")
      .insert(imagePayload)
      .select("id, url, storage_path")
      .single();

    if (imageError) {
      console.error("[Database Insert Error]", imageError);
      // Clean up uploaded image if DB insert failed
      await adminSupabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
      
      const msg = String(imageError.message).toLowerCase();
      if (imageError.code === "42501" || msg.includes("row-level security") || msg.includes("permission") || msg.includes("policy")) {
        return { error: "Bạn không có quyền tải ảnh." };
      }
      return { error: `Không thể lưu thông tin ảnh vào cơ sở dữ liệu: ${imageError.message}` };
    }

    return { 
      ok: true, 
      id: insertedData.id, 
      url: insertedData.url, 
      storage_path: insertedData.storage_path 
    };
  } catch (error: any) {
    console.error("[savePhotosStepAction Error]", error);
    return { error: error.message || "Đã xảy ra lỗi khi tải ảnh lên." };
  }
}

/**
 * Called by the wizard when clicking "Tiếp theo" on photos step to delete any removed photos from DB and storage.
 */
export async function deleteHomestayImagesAction(propertyId: string, imageIds: string[]) {
  try {
    const { user, role } = await getCurrentPartner();
    const adminSupabase = await createAdminClient();
    
    // Verify ownership
    const { data: homestay } = await adminSupabase
      .from("homestays")
      .select("owner_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (!homestay || (role !== "ADMIN" && homestay.owner_id !== user.id)) {
      return { error: "Không có quyền chỉnh sửa chỗ nghỉ này." };
    }

    // Fetch storage paths
    const { data: images } = await adminSupabase
      .from("homestay_images")
      .select("id, storage_path")
      .eq("homestay_id", propertyId)
      .in("id", imageIds);

    if (images && images.length > 0) {
      const paths = images.map((img) => img.storage_path).filter(Boolean) as string[];
      if (paths.length > 0) {
        await adminSupabase.storage.from(IMAGE_BUCKET).remove(paths);
      }
      await adminSupabase
        .from("homestay_images")
        .delete()
        .eq("homestay_id", propertyId)
        .in("id", imageIds);
    }
    return { ok: true };
  } catch (err: any) {
    console.error("[deleteHomestayImagesAction] Error:", err);
    return { error: err.message || "Không thể xóa ảnh cũ." };
  }
}

/**
 * Updates sort orders and cover flags for all remaining photos in this homestay.
 */
export async function updateImagesSortOrderAction(propertyId: string, imageIdsInOrder: string[]) {
  try {
    const { user, role } = await getCurrentPartner();
    const adminSupabase = await createAdminClient();

    // Verify ownership
    const { data: homestay } = await adminSupabase
      .from("homestays")
      .select("owner_id")
      .eq("id", propertyId)
      .maybeSingle();

    if (!homestay || (role !== "ADMIN" && homestay.owner_id !== user.id)) {
      return { error: "Không có quyền chỉnh sửa." };
    }

    // Update each image's sort_order and is_primary
    for (let i = 0; i < imageIdsInOrder.length; i++) {
      const imgId = imageIdsInOrder[i];
      await adminSupabase
        .from("homestay_images")
        .update({
          sort_order: i,
          is_primary: i === 0,
        })
        .eq("id", imgId)
        .eq("homestay_id", propertyId);
    }
    return { ok: true };
  } catch (err: any) {
    console.error("[updateImagesSortOrderAction] Error:", err);
    return { error: err.message || "Không thể sắp xếp lại ảnh." };
  }
}

export async function saveRegistrationStepAction({
  propertyId,
  stepIndex,
  nextStepIndex,
  stepKey,
  draftPatch,
}: {
  propertyId: string;
  stepIndex: number;
  nextStepIndex: number;
  stepKey: string;
  draftPatch?: Record<string, any>;
}) {
  const { supabase, user, role } = await getCurrentPartner();
  
  const adminSupabase = await createAdminClient();
  const { data: homestay, error: fetchErr } = await adminSupabase
    .from("homestays")
    .select("owner_id, registration_checklist")
    .eq("id", propertyId)
    .maybeSingle();

  if (fetchErr || !homestay) {
    return { error: "Không tìm thấy chỗ nghỉ." };
  }

  if (role !== "ADMIN" && homestay.owner_id !== user.id) {
    return { error: "Bạn không có quyền chỉnh sửa chỗ nghỉ này." };
  }

  const oldChecklist = (homestay.registration_checklist as Record<string, any>) || {};
  const oldCompletedSteps = oldChecklist.completedSteps || {};
  const oldCurrentStep = typeof oldChecklist.currentStep === "number" ? oldChecklist.currentStep : 0;

  const completedSteps = {
    ...oldCompletedSteps,
    [stepKey]: true,
  };

  let draftState = oldChecklist.draftState || {};
  if (draftPatch) {
    draftState = {
      ...draftState,
      ...draftPatch,
    };
  }

  const newCurrentStep = Math.max(oldCurrentStep, nextStepIndex);

  const newChecklist = {
    ...oldChecklist,
    currentStep: newCurrentStep,
    completedSteps,
    draftState,
    updatedAt: new Date().toISOString(),
    basic: completedSteps.basicInfo === true || oldChecklist.basic === true,
    location: completedSteps.address === true || oldChecklist.location === true,
    images: completedSteps.photos === true || oldChecklist.images === true,
    rooms: completedSteps.rooms === true || oldChecklist.rooms === true,
    pricing: completedSteps.price === true || oldChecklist.pricing === true,
    amenities: completedSteps.amenities === true || oldChecklist.amenities === true,
    policies: completedSteps.policies === true || oldChecklist.policies === true,
  };

  const { error: updateErr } = await adminSupabase
    .from("homestays")
    .update({
      registration_checklist: newChecklist,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propertyId);

  if (updateErr) {
    return { error: "Lưu tiến độ thất bại: " + updateErr.message };
  }

  revalidatePath("/host");
  revalidatePath("/host/list");
  return { ok: true, registration_checklist: newChecklist };
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
  await adminSupabase.from("homestay_images").update({ is_primary: false }).eq("homestay_id", propertyId);
  const { error } = await adminSupabase
    .from("homestay_images")
    .update({ is_primary: true, sort_order: 0 })
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
  revalidatePath("/host/list");
  revalidatePath(`/host/${id}`);
  revalidatePath("/homestays");
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
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
  revalidatePath("/host/list");
  revalidatePath(`/host/${id}`);
  revalidatePath("/homestays");
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
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
  revalidatePath("/host/list");
  revalidatePath(`/host/${id}`);
  revalidatePath("/homestays");
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  redirect(`/host/${id}?status=delete_requested`);
}

export async function deleteHostRegistration(formData: FormData) {
  const { user, role } = await getCurrentPartner();
  const id = getString(formData, "id");
  const confirmed = formData.get("confirm_delete_registration") === "on";

  if (!id || !confirmed) {
    redirectToHostError("delete_request_invalid");
  }

  const property = await getOwnedProperty(id, user.id, role);
  if (
    property.status === "DELETED" ||
    (property.status === "APPROVED" && property.is_active)
  ) {
    redirectToHostError("blocked_property");
  }

  await updateOwnedPropertyStatus(id, {
    status: "DELETED",
    is_active: false,
    delete_reason: "Host deleted unfinished registration",
  });

  revalidatePath("/host");
  revalidatePath("/host/list");
  revalidatePath("/admin/properties");
  revalidatePath("/admin");
  redirect("/host?status=registration_deleted");
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
