import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const article = await prisma.articles.findUnique({
      where: { slug },
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
        { error: 'Article not found' },
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
      author: article.author.name,
      author_id: article.author.id,
      author_email: article.author.email
    }

    return NextResponse.json(formattedArticle)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
