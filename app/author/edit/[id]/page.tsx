'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Category { id: number; name: string }
interface Article {
  id: number
  title: string
  summary: string
  content: string
  image_url?: string
  category_id: number
  published_at: string
  priority: number
}

export default function EditArticlePage() {
  const params = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    category_id: '',
    priority: 0,
  })

  // Guard + fetch initial data
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { window.location.href = '/auth/login'; return }
    const user = JSON.parse(stored)
    if (user.role !== 'author') { window.location.href = '/'; return }

    const load = async () => {
      try {
        const [catsRes, articleRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/articles/${params.id}`)
        ])
        const cats = await catsRes.json()
        setCategories(cats)
        const article: Article = await articleRes.json()
        if (!articleRes.ok) throw new Error((article as any).error || 'Không tìm thấy bài viết')
        setForm({
          title: article.title,
          summary: article.summary || '',
          content: article.content,
          image_url: article.image_url || '',
          category_id: String(article.category_id || ''), // field có trong API by ID
          priority: article.priority || 0,
        })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'priority' ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/articles/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          content: form.content,
          image_url: form.image_url || undefined,
          category_id: form.category_id ? Number(form.category_id) : undefined,
          priority: form.priority,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật bài viết')
      setMessage('Cập nhật bài viết thành công!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload thất bại')
      setForm(prev => ({ ...prev, image_url: data.url }))
      setMessage('Upload ảnh thành công!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return
    setSaving(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/articles/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể xóa bài viết')
      window.location.href = '/author'
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Đang tải...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài viết</h1>
          <div className="space-x-4">
            <Link href="/author" className="text-gray-800 hover:text-gray-900 font-semibold">← Danh sách</Link>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 font-semibold">Xóa</button>
          </div>
        </div>

        {message && (<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">{message}</div>)}
        {error && (<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>)}

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 text-gray-900 font-semibold" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tóm tắt</label>
            <textarea name="summary" value={form.summary} onChange={handleChange} rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 text-gray-900 font-semibold" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nội dung *</label>
            <textarea name="content" value={form.content} onChange={handleChange} rows={8} required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 text-gray-900 font-semibold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Ảnh bài viết</label>
              <input type="file" accept="image/*" onChange={handleUpload}
                className="block w-full text-sm text-gray-900 font-semibold file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {form.image_url && (
                <div className="mt-3">
                  <img src={form.image_url} alt="preview" className="h-32 rounded border" />
                  <input name="image_url" value={form.image_url} onChange={handleChange}
                    className="mt-2 w-full px-3 py-2 border border-gray-200 rounded text-sm text-gray-900 font-semibold" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Danh mục *</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 text-gray-900 font-semibold">
                <option value="" disabled>Chọn danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Độ ưu tiên (0-9)</label>
            <input name="priority" type="number" min={0} max={9} value={form.priority} onChange={handleChange}
              className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 text-gray-900 font-semibold" />
          </div>
          <div>
            <button type="submit" disabled={saving}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


