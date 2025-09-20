import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Lấy token từ cookie
  const token = request.cookies.get('token')?.value
  
  // Các route không cần authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/articles',
    '/api/article-detail',
    '/api/categories',
    '/api/upload'
  ]
  
  // Các route author cần authentication
  const authorRoutes = [
    '/author'
  ]
  
  // Kiểm tra nếu là route public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Kiểm tra nếu là route author
  const isAuthorRoute = authorRoutes.some(route => pathname.startsWith(route))
  
  // Nếu không có token và đang truy cập route author, redirect đến login
  if (!token && isAuthorRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Nếu đã có token và đang ở trang login/register, redirect về trang chủ
  if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
