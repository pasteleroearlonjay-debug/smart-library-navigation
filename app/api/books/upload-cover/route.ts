import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to verify admin authentication
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminUser = request.headers.get('x-admin-user')
  
  return !!(adminToken && adminUser)
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bookId = formData.get('bookId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = bookId 
      ? `book-${bookId}-${timestamp}.${fileExt}`
      : `book-${timestamp}-${random}.${fileExt}`
    const filePath = `book-covers/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true // Overwrite if file exists
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath
    })

  } catch (error) {
    console.error('Error in POST /api/books/upload-cover:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


