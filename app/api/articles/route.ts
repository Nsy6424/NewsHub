import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuthToken, isAuthor } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Lấy query parameters
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Xây dựng where clause
    const where: any = {}

    if (category && category !== 'Tất cả') {
      // Tìm category theo name (vì frontend gửi name thay vì slug)
      const categoryRecord = await prisma.categories.findFirst({
        where: { name: category }
      })
      if (categoryRecord) {
        where.category_id = categoryRecord.id
      }
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
        // So khớp theo slug để hỗ trợ tìm không dấu/viết hoa thường
        { slug: { contains: normalizedSearch.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'), mode: 'insensitive' } }
      ]
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
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { published_at: 'desc' }
      ],
      skip: offset,
      take: limit
    })

    // Format response + chuyển BigInt -> Number (không bao gồm content)
    const formattedArticles = articles.map(article => ({
      id: Number(article.id),
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      // content: article.content, // Không hiển thị content trong danh sách
      image_url: article.image_url,
      priority: article.priority,
      published_at: article.published_at.toISOString(),
      created_at: article.created_at.toISOString(),
      updated_at: article.updated_at.toISOString(),
      category: article.category.name,
      category_slug: article.category.slug,
      author: article.author.name,
      author_id: article.author.id
    }))

    return NextResponse.json({
      articles: formattedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Tạo bài viết mới (chỉ Author)
export async function POST(request: NextRequest) {
  try {
    // Xác thực user
    const user = verifyAuthToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Cần đăng nhập để tạo bài viết' },
        { status: 401 }
      )
    }

    // Kiểm tra quyền Author
    if (!isAuthor(user)) {
      return NextResponse.json(
        { error: 'Chỉ tác giả mới có thể tạo bài viết' },
        { status: 403 }
      )
    }

    let body;
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Request body phải là JSON hợp lệ' },
        { status: 400 }
      )
    }

    const { title, summary, content, image_url, category_id, priority } = body

    // Validation
    if (!title || !content || !category_id) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: title, content, category_id' },
        { status: 400 }
      )
    }

    // Kiểm tra category tồn tại
    const category = await prisma.categories.findUnique({
      where: { id: BigInt(category_id) }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Danh mục không tồn tại' },
        { status: 400 }
      )
    }

    // Tạo slug từ title
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .trim('-') + '-' + Date.now() // Add timestamp for uniqueness

    // Tạo bài viết mới
    const newArticle = await prisma.articles.create({
      data: {
        title,
        summary: summary || '',
        content,
        slug,
        image_url: image_url || null,
        priority: priority || 0,
        category_id: BigInt(category_id),
        author_id: user.userId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Format response
    const formattedArticle = {
      id: Number(newArticle.id),
      slug: newArticle.slug,
      title: newArticle.title,
      summary: newArticle.summary,
      content: newArticle.content,
      image_url: newArticle.image_url,
      priority: newArticle.priority,
      published_at: newArticle.published_at.toISOString(),
      created_at: newArticle.created_at.toISOString(),
      updated_at: newArticle.updated_at.toISOString(),
      category: newArticle.category.name,
      category_slug: newArticle.category.slug,
      author: newArticle.author.name,
      author_id: newArticle.author.id
    }

    return NextResponse.json({
      message: 'Tạo bài viết thành công',
      article: formattedArticle
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi tạo bài viết' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}



