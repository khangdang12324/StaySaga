export type AppRole = "USER" | "PARTNER" | "ADMIN";
export type LegacyAppRole = "guest" | "host" | "admin";
export type ProfileStatus = "ACTIVE" | "BLOCKED";

type MaybeSingleResult = Promise<{
  data?: Record<string, string | null> | null;
}>;

type SupabaseSelectBuilder = {
  eq: (column: string, value: string) => {
    maybeSingle: () => PromiseLike<Awaited<MaybeSingleResult>>;
  };
};

export type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => SupabaseSelectBuilder;
  };
};

export function normalizeAppRole(role?: string | null): AppRole {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "PARTNER" || normalized === "HOST") return "PARTNER";
  return "USER";
}

export async function getUserRole(
  supabase: SupabaseLike,
  userId: string,
): Promise<AppRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return normalizeAppRole(data?.role);
}

export async function getProfileStatus(
  supabase: SupabaseLike,
  userId: string,
): Promise<ProfileStatus> {
  const { data } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  return data?.status === "BLOCKED" ? "BLOCKED" : "ACTIVE";
}

export function canAccessPartner(role: AppRole) {
  return role === "PARTNER" || role === "ADMIN";
}

export function canAccessHost(role: AppRole) {
  return canAccessPartner(role);
}

export function canAccessAdmin(role: AppRole) {
  return role === "ADMIN";
}
