import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    // Chuyển BigInt -> Number để tránh lỗi serialize BigInt
    const safeCategories = categories.map((cat) => ({
      id: Number(cat.id),
      name: cat.name,
      slug: cat.slug,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
      _count: cat._count,
    }))

    return NextResponse.json(safeCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Tạo danh mục mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.name) {
      return NextResponse.json({ error: 'Thiếu name' }, { status: 400 })
    }

    const name: string = String(body.name).trim()
    if (!name) {
      return NextResponse.json({ error: 'Tên danh mục không hợp lệ' }, { status: 400 })
    }

    // Tạo slug từ name nếu không truyền vào
    const rawSlug: string = body.slug ? String(body.slug) : name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Đảm bảo slug không trùng (nếu trùng thêm hậu tố thời gian)
    const existed = await prisma.categories.findUnique({ where: { slug: rawSlug } })
    const slug = existed ? `${rawSlug}-${Date.now()}` : rawSlug

    const created = await prisma.categories.create({
      data: { name, slug }
    })

    return NextResponse.json({ id: Number(created.id), name: created.name, slug: created.slug }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
