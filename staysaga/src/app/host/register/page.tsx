import { redirect } from "next/navigation";
import PropertyRegistrationWizard from "./PropertyRegistrationWizard";
import {
  canAccessPartner,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Đăng chỗ nghỉ | StaySaga",
};

type HostRegisterPageProps = {
  searchParams: Promise<{ propertyId?: string; new?: string }>;
};

export default async function HostRegisterPage({ searchParams }: HostRegisterPageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) redirect("/login?next=/host/register");

  const role = await getUserRole(
    supabase as unknown as SupabaseLike,
    session.user.id,
  );
  if (!canAccessPartner(role)) redirect("/host/onboard");

  const params = await searchParams;
  let initialDraft = null;

  if (params.propertyId) {
    const select = "*";
    let { data: listing } = await supabase
      .from("homestays")
      .select(select)
      .eq("id", params.propertyId)
      .eq("owner_id", session.user.id)
      .single();

    if (!listing) {
      const adminSupabase = await createAdminClient();
      const retry = await adminSupabase
        .from("homestays")
        .select(select)
        .eq("id", params.propertyId)
        .eq("owner_id", session.user.id)
        .single();
      listing = retry.data;
    }

    if (listing) {
      initialDraft = convertListingToDraft(listing);
    }
  }

  return <PropertyRegistrationWizard initialDraft={initialDraft} userId={session.user.id} />;
}

function convertListingToDraft(listing: any): any {
  if (listing.registration_checklist?.draftState) {
    const draft = listing.registration_checklist.draftState;
    draft.id = listing.id;
    if (typeof listing.registration_checklist.currentStep === "number") {
      draft.currentStep = listing.registration_checklist.currentStep;
    }
    return draft;
  }

  const beds = listing.beds || 1;
  const bedroomsCount = listing.bedrooms || 1;

  const bedrooms = Array.from({ length: bedroomsCount }).map((_, i) => ({
    id: `room-${i}`,
    double: i === 0 ? Math.floor(beds / 2) : 0,
    single: i === 0 ? beds % 2 : 0,
    sofa: 0,
  }));

  const amenities: string[] = [];
  return {
    id: listing.id,
    propertyType: listing.property_type || "homestay",
    unitMode: (listing.available_units || 1) > 1 ? "multiple" : "single",
    name: listing.name || "",
    description: listing.description || "",
    country: listing.country || "Vietnam",
    city: listing.city || "",
    district: listing.district || "",
    address: listing.address || "",
    locationNote: listing.directions_note || listing.location_note || "",
    latitude: listing.latitude ? String(listing.latitude) : "",
    longitude: listing.longitude ? String(listing.longitude) : "",
    channelManager: "no",
    bedrooms,
    maxGuests: listing.max_guests || 2,
    bathrooms: listing.bathrooms || 1,
    area: listing.area_sqm || listing.area_m2 ? String(listing.area_sqm || listing.area_m2) : "",
    welcomeChildren: listing.policies?.allowChildren !== false,
    hasCrib: false,
    amenities,
    parking: "none",
    parkingReservation: "not_required",
    parkingLocation: "onsite",
    parkingType: "private",
    languages: ["Tiếng Việt"],
    extraLanguages: [],
    allowSmoking: listing.policies?.allowSmoking || false,
    allowParties: listing.policies?.allowParties || false,
    petsPolicy: listing.policies?.allowPets ? "yes" : "no",
    petFee: "free",
    checkInFrom: listing.policies?.checkInFrom || "15:00",
    checkInTo: listing.policies?.checkInTo || "18:00",
    checkOutFrom: listing.policies?.checkOutFrom || "08:00",
    checkOutTo: listing.policies?.checkOutTo || "11:00",
    partnerProfile: [],
    partnerName: listing.owner_name || "",
    partnerBio: "",
    bookingMode: listing.booking_mode === "INSTANT" ? "instant" : "request",
    price: listing.price_per_night ? String(listing.price_per_night) : "",
    promotion: false,
    availabilityStart: "asap",
    availabilityOpenMode: "continuous",
    availabilityOpenDays: 30,
    syncCalendar: false,
    allowLongStays: false,
    maxStayNights: 30,
    nonRefundable: false,
    nonRefundableDiscount: 10,
    cancellationFreeDays: 1,
    accidentalBookingProtection: true,
  };
}
