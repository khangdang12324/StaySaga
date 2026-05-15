export type AppRole = "guest" | "host" | "admin";

export type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => any;
    eq: (column: string, value: string) => any;
    maybeSingle: () => Promise<{
      data: { role?: AppRole | null } | null;
      error: any;
    }>;
  };
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
