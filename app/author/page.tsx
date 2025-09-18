'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: 'reader' | 'author'
}

export default function AuthorDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [items, setItems] = useState<Array<{ id: number; title: string; published_at: string; category: string; image_url?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('Tất cả')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Sắp xếp để "Khác" luôn ở cuối
  const orderedCategories = useMemo(() => {
    const names = [...categories]
    const idx = names.indexOf('Khác')
    if (idx !== -1) {
      names.splice(idx, 1)
      names.push('Khác')
    }
    return names
  }, [categories])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const u = JSON.parse(stored) as User
      if (u.role !== 'author') {
        window.location.href = '/'
        return
      }
      setUser(u)
    } else {
      window.location.href = '/auth/login'
    }
  }, [])

  // Load các bài viết của author để hiển thị phía dưới
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/my-articles?page=${page}&limit=6`, { headers: { 'Authorization': `Bearer ${token || ''}` } })
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Không thể tải bài viết')
        const mapped = (data.articles || []).map((a: any) => ({ id: a.id, title: a.title, published_at: a.published_at, category: a.category, image_url: a.image_url }))
        setItems(mapped)
        if (data.pagination?.totalPages) setTotalPages(data.pagination.totalPages)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  // Load categories từ DB để hiển thị ở bộ lọc
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data) => {
        const names = (data || []).map((c: any) => c.name)
        setCategories(names)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  const handleDelete = async (articleId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xóa bài viết thất bại')
      setItems(prev => prev.filter(a => a.id !== articleId))
      alert('Đã xóa bài viết')
    } catch (e: any) {
      alert(e.message || 'Không thể xóa bài viết')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang kiểm tra phiên đăng nhập...
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title + Actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bài viết</h1>
          <Link href="/author/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">Tạo bài viết mới</Link>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm bài viết..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-semibold"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-semibold"
          >
            <option value="Tất cả">Tất cả</option>
            {orderedCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading && <div className="text-gray-600">Đang tải...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="space-y-5">
            {items
              .filter(a => (filterCategory === 'Tất cả' || a.category === filterCategory))
              .filter(a => (a.title + ' ' + a.category).toLowerCase().includes(search.toLowerCase()))
              .map(a => (
              <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Đã xuất bản</span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{a.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{a.title}</h3>
                    <p className="text-sm text-gray-500">Tạo lúc: {new Date(a.published_at).toLocaleTimeString('vi-VN')} {new Date(a.published_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/articles/${a.id}`} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700" title="Xem">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      </svg>
                    </Link>
                    <Link href={`/author/edit/${a.id}`} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700" title="Chỉnh sửa">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712z" />
                        <path d="M3 17.25V21h3.75L19.31 8.44l-3.712-3.712L3 17.25z" />
                      </svg>
                    </Link>
                    <button onClick={() => handleDelete(a.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600" title="Xóa">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M9 2.25A1.5 1.5 0 007.5 3.75v.75H4.125a.75.75 0 000 1.5H5.25l.777 12.437A3 3 0 009.02 21.375h5.96a3 3 0 002.993-2.938L18.75 6h1.125a.75.75 0 000-1.5H16.5V3.75A1.5 1.5 0 0015 2.25H9zm1.5 3h3V3.75h-3V5.25zM10.5 9a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0V9zm4.5.75a.75.75 0 00-1.5 0v7.5a.75.75 0 001.5 0v-7.5z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-gray-600">Chưa có bài viết nào. Hãy bắt đầu bằng cách tạo bài viết mới.</div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg font-semibold text-gray-900"
              >
                Trang trước
              </button>
              <span className="text-sm text-gray-800 font-semibold">Trang {page}/{totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg font-semibold text-gray-900"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


