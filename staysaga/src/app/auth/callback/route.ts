import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * OAuth Callback Handler (PKCE Flow)
 * 
 * Sau khi user đăng nhập thành công trên Google/Facebook/GitHub,
 * Supabase sẽ redirect user về URL này kèm theo `code` param.
 * Route này đổi code lấy session, lưu vào cookie, rồi redirect về trang chủ.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Use configured public site URL to avoid internal container addresses (like http://0.0.0.0:3000)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Đăng nhập thành công -> Redirect về trang chủ hoặc trang trước đó
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // Nếu có lỗi -> Redirect về trang login kèm thông báo
  return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`)
}
