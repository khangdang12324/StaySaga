import { notFound, redirect } from "next/navigation";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { AmenitiesForm } from "./AmenitiesForm";

type Props = {
  params: Promise<{ id: string }>;
};

type Listing = {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  owner_id?: string | null;
  area_sqm?: number | string | null;
};

export default async function AmenitiesPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host");

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const { id } = await params;
  let { data: listing } = await supabase
    .from("homestays")
    .select("id, name, address, city, owner_id, area_sqm")
    .eq("id", id)
    .eq("owner_id", session.user.id)
    .single();

  if (!listing) {
    const adminSupabase = await createAdminClient();
    const retry = await adminSupabase
      .from("homestays")
      .select("id, name, address, city, owner_id, area_sqm")
      .eq("id", id)
      .eq("owner_id", session.user.id)
      .single();
    listing = retry.data;
  }

  if (!listing) notFound();

  const property = listing as Listing;

  // Query already-saved amenities for this homestay
  const { data: homestayAmenities } = await supabase
    .from("homestay_amenities")
    .select("amenity_id, amenities(name)")
    .eq("homestay_id", id);

  const savedAmenityNames = (homestayAmenities || [])
    .map((item: any) => item.amenities?.name)
    .filter(Boolean) as string[];

  return (
    <AmenitiesForm
      propertyId={property.id}
      propertyName={property.name || "Chỗ nghỉ"}
      initialAreaSqm={Number(property.area_sqm || 0)}
      savedAmenityNames={savedAmenityNames}
    />
  );
}
