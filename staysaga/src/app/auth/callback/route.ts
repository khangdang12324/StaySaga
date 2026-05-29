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
  const next = getSafeNextPath(searchParams.get('next'))

  // Use configured public site URL to avoid internal container addresses (like http://0.0.0.0:3000)
  const siteUrl = getSiteOrigin(request, origin)

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

function getSiteOrigin(request: Request, requestOrigin: string): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (configuredSiteUrl) {
    return new URL(configuredSiteUrl).origin
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const host = forwardedHost ?? request.headers.get('host')

  if (host && !isInternalHost(host)) {
    const protocol = forwardedProto ?? (host.includes('localhost') ? 'http' : 'https')
    return new URL(`${protocol}://${host}`).origin
  }

  if (isInternalHost(new URL(requestOrigin).host)) {
    return 'http://localhost:3000'
  }

  return requestOrigin
}

function isInternalHost(host: string): boolean {
  return host.split(':')[0] === '0.0.0.0'
}

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }

  return next
}
