"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
      full_name:
        user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    },
    { onConflict: "id" },
  );

  return { supabase, user };
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  homestayId: string,
  file: File | null,
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
    redirectToHostError("upload_failed");
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);

  const { error: imageError } = await supabase.from("homestay_images").insert({
    homestay_id: homestayId,
    url: data.publicUrl,
    storage_path: storagePath,
    alt: file.name,
  });

  if (imageError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([storagePath]);
    redirectToHostError("image_save_failed");
  }

  return data.publicUrl;
}

export async function getHostDashboardData(): Promise<HostDashboardData> {
  const { supabase, user } = await getCurrentUser();

  const { data: listings } = await supabase
    .from("homestays")
    .select(
      "id, slug, name, description, address, city, country, price_per_night, max_guests, bedrooms, beds, bathrooms, avg_rating, is_active, created_at, homestay_images(id, url, storage_path)",
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

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

  const normalizedListings = (listings || []).map((listing) => ({
    ...listing,
    price_per_night: Number(listing.price_per_night || 0),
    avg_rating: Number(listing.avg_rating || 0),
  })) as HostListing[];

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

export async function createHostHomestay(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const name = getString(formData, "name");
  const city = getString(formData, "city");
  const price = getNumber(formData, "price_per_night");

  if (!name || !city || price <= 0) {
    redirectToHostError("invalid");
  }

  const { data, error } = await supabase
    .from("homestays")
    .insert({
      owner_id: user.id,
      slug: createSlug(name),
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
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirectToHostError("create_failed");
  }

  const image = formData.get("image");
  await uploadImage(
    supabase,
    user.id,
    data.id,
    image instanceof File ? image : null,
  );

  revalidatePath("/host");
  revalidatePath("/homestays");
  redirectToHost("created");
}

export async function updateHostHomestay(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
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

export async function deleteHostHomestay(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const id = getString(formData, "id");

  if (!id) {
    redirectToHostError("invalid");
  }

  const { data: images } = await supabase
    .from("homestay_images")
    .select("storage_path, homestay:homestays(owner_id)")
    .eq("homestay_id", id);

  const imageRows = (images || []) as {
    storage_path: string | null;
    homestay: { owner_id: string } | { owner_id: string }[] | null;
  }[];

  const canDelete = imageRows.every((image) => {
    const homestay = Array.isArray(image.homestay)
      ? image.homestay[0]
      : image.homestay;
    return homestay?.owner_id === user.id;
  });

  if (imageRows.length > 0 && !canDelete) {
    redirectToHostError("delete_failed");
  }

  const paths =
    imageRows
      ?.map((image) => image.storage_path)
      .filter((path): path is string => Boolean(path)) || [];

  if (paths.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("homestays")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirectToHostError("delete_failed");
  }

  revalidatePath("/host");
  revalidatePath("/homestays");
  redirectToHost("deleted");
}
