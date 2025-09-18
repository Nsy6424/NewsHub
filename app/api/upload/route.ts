import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

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

    const ext = file.name.split('.').pop() || 'jpg'
    const baseName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '').split('.')[0] || 'image'
    const filename = `${baseName}-${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, filename)

    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${filename}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Lỗi khi upload ảnh' }, { status: 500 })
  }
}


