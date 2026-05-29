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

/**
 * Check app_metadata from Supabase auth user to determine partner status.
 * This is a fallback for when the DB enum doesn't have PARTNER value yet.
 */
export function getRoleFromAppMetadata(
  appMetadata?: Record<string, unknown> | null
): AppRole | null {
  if (!appMetadata) return null;
  if (appMetadata.is_host === true) return "PARTNER";
  if (appMetadata.role) return normalizeAppRole(String(appMetadata.role));
  return null;
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

  const dbRole = normalizeAppRole(data?.role);

  // If DB says USER, check app_metadata via admin API as fallback
  // (needed when PARTNER enum value isn't in the DB yet)
  if (dbRole === "USER") {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key!
      );
      const { data: userData } = await adminClient.auth.admin.getUserById(userId);
      const metaRole = getRoleFromAppMetadata(
        userData?.user?.app_metadata as Record<string, unknown>
      );
      if (metaRole && metaRole !== "USER") return metaRole;
    } catch {
      // silently fall through to dbRole
    }
  }

  return dbRole;
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
