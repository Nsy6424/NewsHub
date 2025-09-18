import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuthToken, isAuthor } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Lấy bài viết theo ID (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const articleId = BigInt(id)

    const article = await prisma.articles.findUnique({
      where: { id: articleId },
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

    if (!article) {
      return NextResponse.json(
        { error: 'Bài viết không tồn tại' },
        { status: 404 }
      )
    }

    // Format response
    const formattedArticle = {
      id: Number(article.id),
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: article.content,
      image_url: article.image_url,
      priority: article.priority,
      published_at: article.published_at.toISOString(),
      created_at: article.created_at.toISOString(),
      updated_at: article.updated_at.toISOString(),
      category: article.category.name,
      category_slug: article.category.slug,
      category_id: Number(article.category.id),
      author: article.author.name,
      author_id: article.author.id,
      author_email: article.author.email
    }

    return NextResponse.json(formattedArticle)
  } catch (error) {
    console.error('Error fetching article by ID:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi lấy bài viết' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Cập nhật bài viết (chỉ Author sở hữu)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Xác thực user
    const user = verifyAuthToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Cần đăng nhập để sửa bài viết' },
        { status: 401 }
      )
    }

    // Kiểm tra quyền Author
    if (!isAuthor(user)) {
      return NextResponse.json(
        { error: 'Chỉ tác giả mới có thể sửa bài viết' },
        { status: 403 }
      )
    }

    const { id } = await params
    const articleId = BigInt(id)

    // Kiểm tra bài viết tồn tại và thuộc sở hữu
    const existingArticle = await prisma.articles.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        author_id: true,
        slug: true
      }
    })

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Bài viết không tồn tại' },
        { status: 404 }
      )
    }

    // Kiểm tra quyền sở hữu
    if (existingArticle.author_id !== user.userId) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể sửa bài viết của mình' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, summary, content, image_url, category_id, priority } = body

    // Validation (chỉ validate các field được gửi)
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: 'Tiêu đề không được để trống' },
        { status: 400 }
      )
    }

    if (content !== undefined && !content.trim()) {
      return NextResponse.json(
        { error: 'Nội dung không được để trống' },
        { status: 400 }
      )
    }

    // Kiểm tra category nếu được cung cấp
    if (category_id !== undefined) {
      const category = await prisma.categories.findUnique({
        where: { id: BigInt(category_id) }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Danh mục không tồn tại' },
          { status: 400 }
        )
      }
    }

    // Tạo slug mới nếu title thay đổi
    let newSlug = existingArticle.slug
    if (title && title.trim()) {
      newSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') + '-' + Date.now()
    }

    // Chuẩn bị data update (chỉ update các field được gửi)
    const updateData: any = {
      updated_at: new Date()
    }

    if (title !== undefined) updateData.title = title.trim()
    if (summary !== undefined) updateData.summary = summary
    if (content !== undefined) updateData.content = content.trim()
    if (image_url !== undefined) updateData.image_url = image_url
    if (category_id !== undefined) updateData.category_id = BigInt(category_id)
    if (priority !== undefined) updateData.priority = priority
    if (title !== undefined) updateData.slug = newSlug

    // Cập nhật bài viết
    const updatedArticle = await prisma.articles.update({
      where: { id: articleId },
      data: updateData,
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
      id: Number(updatedArticle.id),
      slug: updatedArticle.slug,
      title: updatedArticle.title,
      summary: updatedArticle.summary,
      content: updatedArticle.content,
      image_url: updatedArticle.image_url,
      priority: updatedArticle.priority,
      published_at: updatedArticle.published_at.toISOString(),
      created_at: updatedArticle.created_at.toISOString(),
      updated_at: updatedArticle.updated_at.toISOString(),
      category: updatedArticle.category.name,
      category_slug: updatedArticle.category.slug,
      author: updatedArticle.author.name,
      author_id: updatedArticle.author.id
    }

    return NextResponse.json({
      message: 'Cập nhật bài viết thành công',
      article: formattedArticle
    })

  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi cập nhật bài viết' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Xóa bài viết (chỉ Author sở hữu)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Xác thực user
    const user = verifyAuthToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Cần đăng nhập để xóa bài viết' },
        { status: 401 }
      )
    }

    // Kiểm tra quyền Author
    if (!isAuthor(user)) {
      return NextResponse.json(
        { error: 'Chỉ tác giả mới có thể xóa bài viết' },
        { status: 403 }
      )
    }

    const { id } = await params
    const articleId = BigInt(id)

    // Kiểm tra bài viết tồn tại và thuộc sở hữu
    const existingArticle = await prisma.articles.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        author_id: true,
        title: true
      }
    })

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Bài viết không tồn tại' },
        { status: 404 }
      )
    }

    // Kiểm tra quyền sở hữu
    if (existingArticle.author_id !== user.userId) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể xóa bài viết của mình' },
        { status: 403 }
      )
    }

    // Xóa bài viết
    await prisma.articles.delete({
      where: { id: articleId }
    })

    return NextResponse.json({
      message: 'Xóa bài viết thành công',
      deleted_article: {
        id: Number(articleId),
        title: existingArticle.title
      }
    })

  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Lỗi server khi xóa bài viết' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
