"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessHost, getUserRole } from "@/lib/auth/roles";

function parseValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getSiteSettings(keys?: string[]) {
  const supabase = await createClient();
  let query = supabase.from("site_settings").select("key,value");

  if (keys && keys.length > 0) {
    query = query.in("key", keys);
  }

  const { data, error } = await query.order("key");
  if (error) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries((data || []).map((row) => [row.key, row.value]));
}

export async function updateSiteSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole(supabase, user.id);
  if (role !== "admin") {
    redirect("/");
  }

  const payload: { key: string; value: string }[] = [
    { key: "site_name", value: parseValue(formData.get("site_name")) },
    { key: "hero_title", value: parseValue(formData.get("hero_title")) },
    { key: "hero_subtitle", value: parseValue(formData.get("hero_subtitle")) },
    { key: "accent_color", value: parseValue(formData.get("accent_color")) },
  ].filter((item) => item.value.length > 0);

  // Handle hero image upload (optional)
  const heroFile = formData.get("hero_image");
  if (heroFile && heroFile instanceof File && heroFile.size > 0) {
    // upload to a site-assets bucket
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
      const { data } = supabase.storage.from("site-assets").getPublicUrl(storagePath);
      payload.push({ key: "hero_image", value: data.publicUrl });
    }
  }

  if (payload.length === 0) {
    redirect("/admin?error=invalid");
  }

  const { error } = await supabase.from("site_settings").upsert(payload, {
    onConflict: "key",
  });

  if (error) {
    redirect("/admin?error=update_failed");
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  redirect("/admin?status=updated");
}

export async function assertHostAccess(userId: string) {
  const supabase = await createClient();
  const role = await getUserRole(supabase, userId);
  if (!canAccessHost(role)) {
    redirect("/");
  }
  return { supabase, role };
}
