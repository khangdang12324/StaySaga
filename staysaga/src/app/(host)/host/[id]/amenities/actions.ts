"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export async function saveAmenitiesAction(propertyId: string, area: number, selectedAmenities: string[]) {
  if (!propertyId) {
    return { success: false, error: "Invalid property ID" };
  }

  try {
    const supabase = await createAdminClient();
    
    // Update area_sqm in homestays
    const payload = {
      area_sqm: Number.isFinite(area) ? area : null,
      area_m2: Number.isFinite(area) ? area : null,
      updated_at: new Date().toISOString(),
    };
    
    const { error: homestayError } = await supabase
      .from("homestays")
      .update(payload)
      .eq("id", propertyId);

    if (homestayError) {
      console.error("Error updating homestay area:", homestayError);
      return { success: false, error: homestayError.message };
    }

    // Delete existing relations
    const { error: deleteError } = await supabase
      .from("homestay_amenities")
      .delete()
      .eq("homestay_id", propertyId);

    if (deleteError) {
      console.error("Error deleting old amenities:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Insert selected amenities
    if (selectedAmenities.length > 0) {
      for (const name of selectedAmenities) {
        const key = name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/(^_|_$)/g, "");

        // Find or create the amenity
        const { data: amenityData, error: amenityError } = await supabase
          .from("amenities")
          .upsert({ key, name }, { onConflict: "key" })
          .select("id")
          .single();

        if (amenityError) {
          console.error(`Error upserting amenity ${name}:`, amenityError);
          continue;
        }

        if (amenityData?.id) {
          const { error: linkError } = await supabase
            .from("homestay_amenities")
            .insert({ homestay_id: propertyId, amenity_id: amenityData.id });

          if (linkError) {
            console.error(`Error linking amenity ${name}:`, linkError);
          }
        }
      }
    }

    revalidatePath(`/host/${propertyId}`);
    revalidatePath(`/host/${propertyId}/amenities`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Unexpected error in saveAmenitiesAction:", error);
    return { success: false, error: error?.message || "Unknown error occurred" };
  }
}
