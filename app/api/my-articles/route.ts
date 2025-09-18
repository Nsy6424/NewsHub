import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuthToken, isAuthor } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Lấy danh sách bài viết của Author hiện tại
export async function GET(request: NextRequest) {
  try {
    // Xác thực user
    const user = verifyAuthToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Cần đăng nhập để xem bài viết của bạn' },
        { status: 401 }
      )
    }

    // Kiểm tra quyền Author
    if (!isAuthor(user)) {
      return NextResponse.json(
        { error: 'Chỉ tác giả mới có thể xem danh sách bài viết của mình' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Lấy query parameters
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'published', 'draft' (future feature)
    const sortBy = searchParams.get('sortBy') || 'updated_at' // 'updated_at', 'published_at', 'title'
    const sortOrder = searchParams.get('sortOrder') || 'desc' // 'asc', 'desc'

    const offset = (page - 1) * limit

    // Xây dựng where clause
    const where: any = {
      author_id: user.userId
    }

    if (search) {
      const normalizedSearch = search
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { slug: { contains: normalizedSearch.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'), mode: 'insensitive' } }
      ]
    }

    // Xây dựng orderBy
    const orderBy: any = {}
    if (sortBy === 'title') {
      orderBy.title = sortOrder
    } else if (sortBy === 'published_at') {
      orderBy.published_at = sortOrder
    } else {
      orderBy.updated_at = sortOrder
    }

    // Lấy tổng số bài viết
    const total = await prisma.articles.count({ where })

    // Lấy danh sách bài viết (không bao gồm content để tối ưu performance)
    const articles = await prisma.articles.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        // content: false, // Không lấy content trong danh sách
        image_url: true,
        priority: true,
        published_at: true,
        created_at: true,
        updated_at: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    // Format response
    const formattedArticles = articles.map(article => ({
      id: Number(article.id),
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      image_url: article.image_url,
      priority: article.priority,
      published_at: article.published_at.toISOString(),
      created_at: article.created_at.toISOString(),
      updated_at: article.updated_at.toISOString(),
      category: article.category.name,
      category_slug: article.category.slug,
      category_id: Number(article.category.id)
    }))

    // Thống kê tổng quan
    const stats = await prisma.articles.groupBy({
      by: ['category_id'],
      where: { author_id: user.userId },
      _count: {
        id: true
      }
    })

    const categoryStats = await Promise.all(
      stats.map(async (stat) => {
        const category = await prisma.categories.findUnique({
          where: { id: stat.category_id },
          select: { name: true }
        })
        return {
          category: category?.name || 'Unknown',
          count: stat._count.id
        }
      })
    )

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: {
        total_articles: total,
        by_category: categoryStats
      }
    })

  } catch (error) {
    console.error('Error fetching my articles:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi lấy danh sách bài viết' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
