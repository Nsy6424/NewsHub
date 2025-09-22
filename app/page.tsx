'use client'

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

// Types cho API response
interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  image_url?: string;
  priority: number;
  published_at: string;
  created_at?: string;
  updated_at?: string;
  category: string;
  category_slug: string;
  author: string;
  author_id: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  _count: {
    articles: number;
  };
}

interface ArticlesResponse {
  articles: Article[];
  featured: Article[];
  latest: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(11);

  // Tính danh sách trang hiển thị dạng: < 1 2 3 ... 8 9 10 >
  const visiblePages = useMemo(() => {
    const items: (number | string)[] = []
    const maxButtons = 7 // tổng item số hiển thị (không tính prev/next)
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
      return items
    }

    const showLeft = 2
    const showRight = 2
    const middle = maxButtons - showLeft - showRight // 3

    let start = Math.max(2, page - Math.floor(middle / 2))
    let end = Math.min(totalPages - 1, start + middle - 1)

    if (end - start + 1 < middle) {
      start = Math.max(2, end - middle + 1)
    }

    items.push(1)
    if (start > 2) items.push('...')
    for (let i = start; i <= end; i++) items.push(i)
    if (end < totalPages - 1) items.push('...')
    items.push(totalPages)
    return items
  }, [page, totalPages])

  // Fetch categories khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Không thể tải danh mục');
      }
    };

    fetchCategories();
  }, []);

  // Load user từ localStorage để hiển thị header
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          setCurrentUser(JSON.parse(raw));
        } else {
          // Kiểm tra token từ cookie thông qua API
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
          // Nếu không có token hợp lệ, currentUser vẫn là null (hiển thị nút đăng nhập/đăng ký)
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Nếu có lỗi, currentUser vẫn là null (hiển thị nút đăng nhập/đăng ký)
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setMenuOpen(false);
  };

  // Debounce searchTerm để tránh gọi API liên tục
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 400)
    return () => clearTimeout(id)
  }, [searchTerm])

  // Reset về trang 1 khi đổi danh mục hoặc từ khóa
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, debouncedSearchTerm])

  // Fetch articles khi category, search hoặc page thay đổi
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "Tất cả") {
          params.append('category', selectedCategory);
        }
        if (debouncedSearchTerm) {
          params.append('search', debouncedSearchTerm);
        }
        params.append('page', String(page));
        params.append('limit', String(limit));

        const response = await fetch(`/api/articles?${params}`);
        if (!response.ok) throw new Error('Failed to fetch articles');
        const data: ArticlesResponse = await response.json();
        setArticles(data.articles);
        setFeaturedArticles(data.featured || []);
        setLatestArticles(data.latest || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        } else {
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Không thể tải bài viết');
        setArticles([]);
        setFeaturedArticles([]);
        setLatestArticles([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedCategory, debouncedSearchTerm, page, limit]);

  // Đếm số bài viết theo category
  const getCategoryCount = (category: string) => {
    if (category === "Tất cả") {
      // Tổng số bài viết (không phụ thuộc trang hiện tại)
      return categories.reduce((sum, cat) => sum + (cat._count?.articles || 0), 0)
    }
    return categories.find(cat => cat.name === category)?._count.articles || 0;
  };

  // Danh sách categories hiển thị (đưa "Khác" xuống cuối)
  const displayCategories = (() => {
    const names = categories.map(cat => cat.name)
    const othersIndex = names.indexOf('Khác')
    if (othersIndex !== -1) {
      names.splice(othersIndex, 1)
      names.push('Khác')
    }
    return ['Tất cả', ...names]
  })();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
                Sy's News
              </h1>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm tin tức..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-10 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 text-gray-400 hover:text-gray-600"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Auth / User */}
            <div className="relative">
              {!currentUser ? (
            <div className="flex items-center space-x-4">
                  <Link href="/auth/login" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">Đăng nhập</Link>
                  <Link href="/auth/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Đăng ký</Link>
                </div>
              ) : (
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900 hidden sm:inline">{currentUser.name}</span>
                  <svg className={`w-4 h-4 text-gray-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {menuOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-10 overflow-hidden">
                  {currentUser.role === 'author' && (
                    <Link href="/author" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">Bài viết của tôi</Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {displayCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <span>{category}</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {getCategoryCount(category)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedCategory === "Tất cả" ? "Tất cả tin tức" : `Tin tức ${selectedCategory}`}
          </h2>
          {searchTerm.trim() && !loading && !error && (
          <p className="text-gray-600">
              {`Tìm thấy ${articles.length} bài viết cho "${searchTerm.trim()}"`}
          </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Có lỗi xảy ra</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 ? (
          debouncedSearchTerm ? (
            // Chế độ tìm kiếm: chỉ hiển thị danh sách bài viết
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
              <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200">
                  <Image
                      src={(article.image_url && !article.image_url.includes('your-image.jpg')) ? article.image_url : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"}
                    alt={article.title}
                      width={800}
                      height={400}
                      unoptimized
                      className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="mb-2">
                      <Link href={`/articles/${article.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </Link>
                  </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{article.author}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
            // Chế độ bình thường: Tin Nổi Bật + Tin Tức Mới Nhất
            <div className="space-y-10">
              {/* Tin Nổi Bật */}
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tin Nổi Bật</h3>
                {featuredArticles.length === 0 ? (
                  <div className="text-gray-500">Chưa có tin nổi bật</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredArticles.map((article) => (
                        <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative h-64 bg-gray-200">
                            <Image
                              src={(article.image_url && !article.image_url.includes('your-image.jpg')) ? article.image_url : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop"}
                              alt={article.title}
                              width={1200}
                              height={600}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-6">
                            <div className="mb-3">
                              <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                                {article.category}
                              </span>
                            </div>
                            <h3 className="mb-2">
                              <Link href={`/articles/${article.id}`} className="text-2xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                                {article.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{article.author}</span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(article.published_at)}</span>
                            </div>
                          </div>
                        </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Tin Tức Mới Nhất */}
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tin Tức Mới Nhất</h3>
                {latestArticles.length === 0 ? (
                  <div className="text-gray-500">Chưa có tin tức mới</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestArticles.map((article) => (
                        <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="relative h-48 bg-gray-200">
                            <Image
                              src={(article.image_url && !article.image_url.includes('your-image.jpg')) ? article.image_url : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"}
                              alt={article.title}
                              width={800}
                              height={400}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-6">
                            <div className="mb-3">
                              <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                                {article.category}
                              </span>
                            </div>
                            <h3 className="mb-2">
                              <Link href={`/articles/${article.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                                {article.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{article.author}</span>
                              <span className="mx-2">•</span>
                              <span>
                                {formatDate(
                                  (article.updated_at || article.created_at || article.published_at) as string
                                )}
                              </span>
                            </div>
                          </div>
                        </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )
        ) : (
          !loading && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy bài viết</h3>
            <p className="mt-1 text-sm text-gray-500">
              Thử thay đổi từ khóa tìm kiếm hoặc danh mục để xem thêm bài viết.
            </p>
            </div>
          )
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center">
            <div className="flex items-center rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`mx-1 h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${page === 1 ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                aria-label="Trang trước"
              >
                <span className="text-base">‹</span>
              </button>

              {visiblePages.map((it, idx) => (
                typeof it === 'number' ? (
                  <button
                    key={`p-${it}`}
                    onClick={() => setPage(it)}
                    className={`mx-1 min-w-9 h-9 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${page === it ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {it}
                  </button>
                ) : (
                  <span key={`dot-${idx}`} className="mx-1 h-9 w-9 rounded-lg border border-transparent flex items-center justify-center text-gray-400">…</span>
                )
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`mx-1 h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${page === totalPages ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                aria-label="Trang sau"
              >
                <span className="text-base">›</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
