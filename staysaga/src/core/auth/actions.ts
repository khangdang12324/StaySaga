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
  let origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol =
      host?.includes("localhost") || host?.match(/^\d+\.\d+\.\d+\.\d+/)
        ? "http"
        : "https";
    origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  }
  // Sanity check: never redirect to 0.0.0.0
  if (origin.includes("0.0.0.0")) {
    origin = "http://localhost:3000";
  }
  return origin;
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getRedirectOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
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

export async function signInWithFacebook() {
  const supabase = await createClient();
  const origin = await getRedirectOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${origin}/auth/callback`,
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
