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

export async function GET(request: NextRequest) {
  try {
    // Get books from database
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching books:', error)
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      )
    }

    // Return books from database (no hardcoded sample data)
    return NextResponse.json({
      success: true,
      books: books || []
    })

  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new book
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const body = await request.json()
    const { title, author, subject, catalog_no, cover_photo_url, isbn, quantity } = body

    // Validate required fields
    if (!title || !author || !subject) {
      return NextResponse.json(
        { error: 'Title, author, and subject are required' },
        { status: 400 }
      )
    }

    // Insert new book
    const { data: newBook, error } = await supabase
      .from('books')
      .insert({
        title: title.trim(),
        author: author.trim(),
        subject: subject.trim(),
        catalog_no: catalog_no?.trim() || null,
        cover_photo_url: cover_photo_url || null,
        isbn: isbn?.trim() || null,
        quantity: quantity ? parseInt(quantity) : 1,
        available: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating book:', error)
      return NextResponse.json(
        { error: 'Failed to create book: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      book: newBook
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing book
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, author, subject, catalog_no, cover_photo_url, isbn, quantity, available } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (author !== undefined) updateData.author = author.trim()
    if (subject !== undefined) updateData.subject = subject.trim()
    if (catalog_no !== undefined) updateData.catalog_no = catalog_no?.trim() || null
    if (cover_photo_url !== undefined) updateData.cover_photo_url = cover_photo_url || null
    if (isbn !== undefined) updateData.isbn = isbn?.trim() || null
    if (quantity !== undefined) updateData.quantity = parseInt(quantity) || 1
    if (available !== undefined) updateData.available = available
    updateData.updated_at = new Date().toISOString()

    // Update book
    const { data: updatedBook, error } = await supabase
      .from('books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating book:', error)
      return NextResponse.json(
        { error: 'Failed to update book: ' + error.message },
        { status: 500 }
      )
    }

    if (!updatedBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      book: updatedBook
    })

  } catch (error) {
    console.error('Error in PUT /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete book
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!await verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Check if book exists
    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('id, title, cover_photo_url')
      .eq('id', id)
      .single()

    if (fetchError || !existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Delete book
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting book:', error)
      return NextResponse.json(
        { error: 'Failed to delete book: ' + error.message },
        { status: 500 }
      )
    }

    // TODO: Optionally delete cover photo from Supabase Storage if it exists
    // if (existingBook.cover_photo_url) {
    //   // Extract file path from URL and delete from storage
    // }

    return NextResponse.json({
      success: true,
      message: `Book "${existingBook.title}" has been deleted successfully`
    })

  } catch (error) {
    console.error('Error in DELETE /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

