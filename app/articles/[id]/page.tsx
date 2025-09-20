'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Article {
  id: number
  slug: string
  title: string
  summary: string
  content: string
  image_url?: string
  priority: number
  published_at: string
  created_at: string
  updated_at: string
  category: string
  category_slug: string
  category_id: number
  author: string
  author_id: string
  author_email: string
}

interface RelatedItem {
  id: number
  title: string
  image_url?: string
  published_at: string
  category: string
}

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [related, setRelated] = useState<RelatedItem[]>([])

  useEffect(() => {
    const fetchArticle = async () => {
      if (!params.id) return

      try {
        const response = await fetch(`/api/articles/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Bài viết không tồn tại')
          } else {
            setError('Không thể tải bài viết')
          }
          return
        }

        const data = await response.json()
        setArticle(data)

        // Fetch related articles by category (limit 4), exclude current id
        try {
          const relRes = await fetch(`/api/articles?category=${encodeURIComponent(data.category)}&limit=4`)
          const relData = await relRes.json().catch(() => ({}))
          const items: RelatedItem[] = (relData.articles || [])
            .filter((x: any) => Number(x.id) !== Number(data.id))
            .map((x: any) => ({ id: x.id, title: x.title, image_url: x.image_url, published_at: x.published_at, category: x.category }))
          setRelated(items)
        } catch {}
      } catch (err) {
        console.error('Error fetching article:', err)
        setError('Có lỗi xảy ra khi tải bài viết')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-64 bg-gray-300 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Bài viết không tồn tại'}
          </h1>
          <p className="text-gray-600 mb-6">
            Bài viết bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Article Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span>/</span>
          <Link href={`/?category=${article.category}`} className="hover:text-blue-600">
            {article.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{article.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category Badge */}
          <div className="mb-4">
            <Link
              href={`/?category=${article.category}`}
              className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200"
            >
              {article.category}
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.summary}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center text-gray-600 text-sm mb-6">
            <div className="flex items-center space-x-4">
              <span>👤 {article.author}</span>
              <span>•</span>
              <span>📅 {formatDate(article.published_at)}</span>
              {article.priority > 5 && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    ⭐ Nổi bật
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.image_url && (
          <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg max-w-none">
          <div 
            className="text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Bài viết được đăng ngày {formatDate(article.published_at)}</p>
              {article.updated_at !== article.created_at && (
                <p>Cập nhật lần cuối: {formatDate(article.updated_at)}</p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ← Quay lại
              </button>
            </div>
          </div>
        </footer>

        {/* Related Articles Section (Optional) */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bài viết liên quan</h2>
          {related.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có bài viết liên quan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link key={r.id} href={`/articles/${r.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  {r.image_url && (
                    <div className="relative h-56 rounded-t-xl overflow-hidden">
                      <Image src={r.image_url} alt={r.title} fill unoptimized className="object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-3">
                      <span className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{r.category}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 line-clamp-2">{r.title}</h3>
                    <p className="text-sm text-gray-500 mt-2">{new Date(r.published_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
