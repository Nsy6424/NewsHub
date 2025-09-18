"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'reader' | 'author'
}

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Author Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between text-white">
          <Link href="/author" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold">NewsHub</h1>
          </Link>

          <nav className="flex items-center space-x-6 relative">
            {/* Hai link theo yêu cầu */}
            <Link href="/" className="hover:underline">Tin tức</Link>

            {/* User Dropdown chỉ có Logout */}
            {user && (
              <>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-3 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-indigo-700 font-bold flex items-center justify-center">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium hidden sm:inline">{user.name}</span>
                  <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-40 bg-white text-gray-700 rounded-lg shadow-xl border border-gray-100 overflow-hidden z-10">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Logout</button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {children}
    </div>
  )
}


