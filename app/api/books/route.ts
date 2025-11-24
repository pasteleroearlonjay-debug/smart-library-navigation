import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)


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
    const body = await request.json()
    const { title, author, subject, catalog_no, cover_photo_url, isbn, quantity, shelf } = body

    // Validate required fields
    if (!title || !author || !subject) {
      return NextResponse.json(
        { error: 'Title, author, and subject are required' },
        { status: 400 }
      )
    }

    // Normalize input
    const normalizedTitle = title.trim()
    const normalizedAuthor = author.trim()
    const normalizedSubject = subject.trim()
    
    // Check for duplicate before inserting (case-insensitive, exact match)
    // Can be disabled with DISABLE_DUPLICATE_CHECK env variable for testing
    const disableDuplicateCheck = process.env.DISABLE_DUPLICATE_CHECK === 'true'
    
    if (!disableDuplicateCheck) {
      const { data: existingBooks, error: checkError } = await supabase
        .from('books')
        .select('id, title, author, subject')
        .limit(1000)
      
      if (checkError) {
        console.error('Error checking for duplicates:', checkError)
        // Continue with insert if check fails (don't block on check error)
      } else if (existingBooks && existingBooks.length > 0) {
        // Normalize and compare each book
        const normalizedInput = {
          title: normalizedTitle.toLowerCase(),
          author: normalizedAuthor.toLowerCase(),
          subject: normalizedSubject.toLowerCase()
        }
        
        console.log('Checking for duplicates. Input:', normalizedInput)
        console.log('Total books to check:', existingBooks.length)
        
        const duplicate = existingBooks.find(book => {
          if (!book.title || !book.author || !book.subject) return false
          
          const normalizedBook = {
            title: book.title.trim().toLowerCase(),
            author: book.author.trim().toLowerCase(),
            subject: book.subject.trim().toLowerCase()
          }
          
          const isMatch = 
            normalizedBook.title === normalizedInput.title &&
            normalizedBook.author === normalizedInput.author &&
            normalizedBook.subject === normalizedInput.subject
          
          if (isMatch) {
            console.log('Duplicate found:', {
              input: normalizedInput,
              existing: normalizedBook,
              bookId: book.id,
              rawBook: book
            })
          }
          
          return isMatch
        })
        
        if (duplicate) {
          return NextResponse.json(
            { 
              error: `A book with the same title ("${normalizedTitle}"), author ("${normalizedAuthor}"), and subject ("${normalizedSubject}") already exists.`,
              duplicate: {
                id: duplicate.id,
                title: duplicate.title,
                author: duplicate.author,
                subject: duplicate.subject
              },
              debug: {
                input: normalizedInput,
                found: {
                  title: duplicate.title?.trim().toLowerCase(),
                  author: duplicate.author?.trim().toLowerCase(),
                  subject: duplicate.subject?.trim().toLowerCase()
                }
              }
            },
            { status: 409 } // Conflict status code
          )
        }
      }
    }
    
    // Build insert object
    const insertData: any = {
      title: normalizedTitle,
      author: normalizedAuthor,
      subject: normalizedSubject,
      catalog_no: catalog_no?.trim() || null,
      cover_photo_url: cover_photo_url || null,
      isbn: isbn?.trim() || null,
      available: true
    }
    
    // Only include quantity if provided (column may not exist)
    if (quantity !== undefined) {
      insertData.quantity = quantity ? parseInt(quantity) : 1
    }
    
    // Include shelf if provided (column may not exist yet)
    if (shelf !== undefined) {
      insertData.shelf = shelf.trim() || 'Shelf 1'
    } else {
      insertData.shelf = 'Shelf 1' // Default shelf
    }

    // Insert new book
    const { data: newBook, error } = await supabase
      .from('books')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating book:', error)
      const errorMessage = error.message || JSON.stringify(error)
      
      // If error is about quantity or shelf column, try again without them
      if (errorMessage.includes('quantity') || errorMessage.includes('shelf')) {
        console.warn('Quantity or shelf column not found, retrying without these fields')
        const retryData = { ...insertData }
        delete retryData.quantity
        delete retryData.shelf
        
        const { data: retryBook, error: retryError } = await supabase
          .from('books')
          .insert(retryData)
          .select()
          .single()
        
        if (retryError) {
          return NextResponse.json(
            { error: 'Failed to create book: ' + retryError.message },
            { status: 500 }
          )
        }
        
        const warnings = []
        if (errorMessage.includes('quantity')) {
          warnings.push('Quantity column not found. Please run: database_migrations/add_quantity_to_books.sql')
        }
        if (errorMessage.includes('shelf')) {
          warnings.push('Shelf column not found. Please run: database_migrations/add_shelf_to_books.sql')
        }
        
        return NextResponse.json({
          success: true,
          book: retryBook,
          warning: warnings.join(' | ')
        }, { status: 201 })
      }
      
      return NextResponse.json(
        { error: 'Failed to create book: ' + errorMessage },
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
    const body = await request.json()
    const { id, title, author, subject, catalog_no, cover_photo_url, isbn, quantity, available, shelf } = body

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
    // Include quantity if provided
    if (quantity !== undefined) {
      updateData.quantity = parseInt(quantity) || 1
    }
    if (available !== undefined) updateData.available = available
    if (shelf !== undefined) updateData.shelf = shelf.trim() || 'Shelf 1'
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
      // If error is about quantity or shelf column, try again without them
      const errorMessage = error.message || JSON.stringify(error)
      if (errorMessage.includes('quantity') || errorMessage.includes('shelf') || 
          errorMessage.includes("Could not find the 'quantity' column") ||
          errorMessage.includes("Could not find the 'shelf' column")) {
        console.warn('Quantity or shelf column not found, retrying without these fields')
        const updateDataWithoutColumns = { ...updateData }
        delete updateDataWithoutColumns.quantity
        delete updateDataWithoutColumns.shelf
        
        const { data: retryBook, error: retryError } = await supabase
          .from('books')
          .update(updateDataWithoutColumns)
          .eq('id', id)
          .select()
          .single()
        
        if (retryError) {
          return NextResponse.json(
            { error: 'Failed to update book: ' + retryError.message },
            { status: 500 }
          )
        }
        
        const warnings = []
        if (errorMessage.includes('quantity')) {
          warnings.push('Quantity column not found. Please run: database_migrations/add_quantity_to_books.sql')
        }
        if (errorMessage.includes('shelf')) {
          warnings.push('Shelf column not found. Please run: database_migrations/add_shelf_to_books.sql')
        }
        
        return NextResponse.json({
          success: true,
          book: retryBook,
          warning: warnings.join(' | ')
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to update book: ' + errorMessage },
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

