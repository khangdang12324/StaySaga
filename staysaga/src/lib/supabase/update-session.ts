import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessAdmin,
  canAccessPartner,
  getProfileStatus,
  getUserRole,
  type SupabaseLike,
} from "@/lib/auth/roles";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect routes logic
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isPublicHostRoute =
    request.nextUrl.pathname.startsWith("/host/list") ||
    request.nextUrl.pathname.startsWith("/host/onboard");
  const isHostRoute =
    request.nextUrl.pathname.startsWith("/host") && !isPublicHostRoute;

  const protectedRoutes = [
    "/profile",
    "/checkout",
    "/favorites",
    "/admin",
    "/bookings",
    "/host",
  ];
  const isProtected =
    protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    ) && !isPublicHostRoute;

  const shouldProtectHostPage =
    request.nextUrl.pathname.startsWith("/host") && !isPublicHostRoute;

  if (!user && (isProtected || shouldProtectHostPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && (isAdminRoute || isHostRoute)) {
    const authSupabase = supabase as unknown as SupabaseLike;
    const role = await getUserRole(authSupabase, user.id);
    const status = await getProfileStatus(authSupabase, user.id);

    if (status === "BLOCKED") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && !canAccessAdmin(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (isHostRoute && !canAccessPartner(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
