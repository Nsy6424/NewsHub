'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Category { id: number; name: string }

export default function NewArticlePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
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

  // Guard: chỉ author
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      window.location.href = '/auth/login'
      return
    }
    const user = JSON.parse(stored)
    if (user.role !== 'author') {
      window.location.href = '/'
    }
  }, [])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then((data) => setCategories(data))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'priority' ? Number(value) : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          content: form.content,
          image_url: form.image_url || undefined,
          category_id: Number(form.category_id),
          priority: form.priority,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Không thể tạo bài viết')
      setMessage('Tạo bài viết thành công!')
      setForm({ title: '', summary: '', content: '', image_url: '', category_id: '', priority: 0 })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tạo bài viết mới</h1>
          <Link href="/author" className="text-blue-700 hover:text-blue-800 font-semibold">← Quay lại Dashboard</Link>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">{message}</div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
        )}

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
              <div className="flex items-center space-x-3">
                <input type="file" accept="image/*" onChange={handleUpload}
                  className="block w-full text-sm text-gray-900 font-semibold file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
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
            <button type="submit" disabled={loading}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50">
              {loading ? 'Đang tạo...' : 'Xuất bản bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


