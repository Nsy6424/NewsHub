import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: name, email, password' },
        { status: 400 }
      )
    }

    // Kiểm tra email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Kiểm tra password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      )
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const password_hash = await bcrypt.hash(password, saltRounds)

    // Tạo user mới
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password_hash,
        role: role || 'reader' // mặc định là reader
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    })

    return NextResponse.json({
      message: 'Đăng ký thành công',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi tạo tài khoản' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
