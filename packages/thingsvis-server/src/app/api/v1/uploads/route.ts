import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { jwtVerify } from 'jose'
import { nanoid } from 'nanoid'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

// Upload directory (relative to project root)
const UPLOAD_DIR = 'uploads'

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || 'thingsvis-dev-secret-key'
  )

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.sub as string
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional authentication - allow anonymous uploads for local mode
    const userId = await getUserIdFromToken(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadPath = join(process.cwd(), 'public', UPLOAD_DIR)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${nanoid()}.${ext}`
    const filePath = join(uploadPath, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    // Return URL
    const url = `/${UPLOAD_DIR}/${filename}`
    
    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId || 'anonymous',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // List uploaded files (optional, for admin purposes)
  const userId = await getUserIdFromToken(request)
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // This is a placeholder - in production, you might want to
  // store file metadata in the database and query it here
  return NextResponse.json({
    message: 'File listing not implemented',
    hint: 'Files are stored in /public/uploads/',
  })
}
