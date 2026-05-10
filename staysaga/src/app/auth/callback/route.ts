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

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Đăng nhập thành công -> Redirect về trang chủ hoặc trang trước đó
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Nếu có lỗi -> Redirect về trang login kèm thông báo
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
