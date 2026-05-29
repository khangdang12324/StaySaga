"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * OAuthCodeHandler
 *
 * Facebook và một số OAuth provider đôi khi redirect về Site URL (trang chủ)
 * thay vì /auth/callback khi Supabase Dashboard chưa whitelist redirect URL,
 * hoặc khi Facebook append #_=_ vào callback URL.
 *
 * Component này phát hiện khi có `?code=` trên bất kỳ trang nào (thường là /),
 * và tự động chuyển tiếp code đó sang /auth/callback để xử lý session đúng cách.
 */
export default function OAuthCodeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    // Chuyển tiếp code sang /auth/callback để xử lý PKCE session
    const next = searchParams.get("next") ?? "/";
    const params = new URLSearchParams({ code });
    if (next !== "/") params.set("next", next);

    router.replace(`/auth/callback?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}
