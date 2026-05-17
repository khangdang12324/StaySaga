export type AppRole = "guest" | "host" | "admin";

export type SupabaseLike = {
  from: (table: string) => any;
};

export async function getUserRole(
  supabase: SupabaseLike,
  userId: string,
): Promise<AppRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role || "guest";
}

export function canAccessHost(role: AppRole) {
  return role === "host" || role === "admin";
}
