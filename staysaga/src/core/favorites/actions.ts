"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Toggle trạng thái yêu thích Homestay của User
 */
export async function toggleFavorite(propertyId: string) {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { error: "Bạn cần đăng nhập để lưu mục yêu thích." };
  }

  const userId = session.user.id;

  // Kiểm tra xem đã lưu chưa
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single();

  if (existing) {
    // Xóa (Unlike)
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    // Thêm (Like)
    await supabase
      .from("favorites")
      .insert({ user_id: userId, property_id: propertyId });
  }

  // Xóa cache trang để icon trái tim cập nhật ngay lập tức
  revalidatePath(`/homestays`);
  revalidatePath(`/homestays/[slug]`, "page");

  return { success: true, isFavorited: !existing };
}

export async function getFavoriteIds(propertyIds: string[]) {
  if (!propertyIds.length) return [];

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("property_id")
    .eq("user_id", session.user.id)
    .in("property_id", propertyIds);

  if (error || !data) return [];
  return data.map((row) => row.property_id);
}
