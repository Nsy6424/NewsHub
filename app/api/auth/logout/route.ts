import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      message: 'Đăng xuất thành công'
    })

    // Xóa auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // Expire ngay lập tức
    })

    return response

  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi đăng xuất' },
      { status: 500 }
    )
  }
}
