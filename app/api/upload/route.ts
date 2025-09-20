import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Thiếu file upload (field name: file)' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ ảnh JPG/PNG/WEBP/GIF' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await fs.mkdir(uploadDir, { recursive: true })
    } catch {}

    // Dùng nguyên tên file (đã làm sạch) để URL luôn giữ nguyên nếu cùng tên
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const baseNameRaw = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '') || 'image'
    const baseNameOnly = baseNameRaw.split('.')[0] || 'image'
    const filename = `${baseNameOnly}.${ext}`
    const filePath = path.join(uploadDir, filename)

    // Nếu đã tồn tại: dùng lại URL cũ (không tạo file mới)
    try {
      await fs.access(filePath)
      const url = `/uploads/${filename}`
      return NextResponse.json({ url })
    } catch {}

    // Chưa tồn tại: ghi file mới (ghi đè nếu cần theo tên cố định)
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Lỗi khi upload ảnh' }, { status: 500 })
  }
}


