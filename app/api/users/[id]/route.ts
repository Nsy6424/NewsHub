import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function isValidUUID(v: string) {
  // RFC 4122 version-agnostic UUID v1-v5
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
}

// GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid user id format (UUID required)' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        _count: { select: { articles: true } }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/users/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid user id format (UUID required)' }, { status: 400 })
    }

    // Kiểm tra tồn tại
    const user = await prisma.users.findUnique({ where: { id }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Không cho xóa nếu user còn bài viết (tránh lỗi ràng buộc FK)
    const articleCount = await prisma.articles.count({ where: { author_id: id } })
    if (articleCount > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa: người dùng vẫn còn bài viết. Hãy chuyển/ xóa bài viết trước.' },
        { status: 400 }
      )
    }

    await prisma.users.delete({ where: { id } })
    return NextResponse.json({ message: 'Đã xóa người dùng thành công', id })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}


