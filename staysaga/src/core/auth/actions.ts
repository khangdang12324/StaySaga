"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/";

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const next = (formData.get("next") as string) || "/";

  if (!email || !password || !fullName) {
    return { error: "Vui lòng nhập đầy đủ thông tin" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getRedirectOrigin(): Promise<string> {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredSiteUrl) {
    return normalizeOrigin(configuredSiteUrl);
  }

  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = forwardedHost ?? headerStore.get("host");

  if (!host) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not defined and Host header is missing");
  }

  const protocol = forwardedProto ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  return normalizeOrigin(`${protocol}://${host}`);
}

function normalizeOrigin(url: string): string {
  const parsed = new URL(url);
  return parsed.origin;
}

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function signInWithGoogle(formData?: FormData) {
  const supabase = await createClient();
  const origin = await getRedirectOrigin();
  const next = getSafeNextPath(formData?.get("next") ?? null);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error(error.message);
    return;
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithFacebook(formData?: FormData) {
  const supabase = await createClient();
  const origin = await getRedirectOrigin();
  const next = getSafeNextPath(formData?.get("next") ?? null);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "public_profile,email",
    },
  });

  if (error) {
    console.error(error.message);
    return;
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Vui lòng nhập email." };
  }

  const origin = await getRedirectOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
