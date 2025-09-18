import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string;
  email: string;
  role: 'reader' | 'author';
}

/**
 * Middleware để xác thực JWT token từ request
 */
export function verifyAuthToken(request: NextRequest): AuthUser | null {
  try {
    // Lấy token từ cookie hoặc Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    // Verify JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser

    return decoded
  } catch (error) {
    console.error('Auth token verification failed:', error)
    return null
  }
}

/**
 * Kiểm tra user có quyền author không
 */
export function isAuthor(user: AuthUser | null): boolean {
  return user?.role === 'author'
}

/**
 * Tạo JWT token cho user
 */
export function createAuthToken(user: { id: string; email: string; role: string }): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
