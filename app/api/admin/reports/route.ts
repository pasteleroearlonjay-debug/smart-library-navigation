import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to verify admin (PIN protection replaces role check)
async function verifyAdmin(request: NextRequest): Promise<{ admin: any } | null> {
  const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminUserStr = request.headers.get('x-admin-user')
  
  if (!adminToken || !adminUserStr) {
    return null
  }

  try {
    const adminUser = JSON.parse(adminUserStr)
    return { admin: adminUser }
  } catch {
    return null
  }
}

// GET - Generate reports
export async function GET(request: NextRequest) {
  const verified = await verifyAdmin(request)
  if (!verified) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
  }

  try {
    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url)
    const yearsExisted = searchParams.get('yearsExisted')
    const publicationDateStart = searchParams.get('publicationDateStart')
    const publicationDateEnd = searchParams.get('publicationDateEnd')

    // Build query for books with all necessary fields
    let booksQuery = supabase
      .from('books')
      .select('id, title, author, subject, available, catalog_no, created_at, publication_date')

    // Apply date filters if provided
    if (yearsExisted) {
      const years = parseInt(yearsExisted)
      if (!isNaN(years) && years > 0) {
        // Calculate the cutoff date: books created at least 'years' years ago
        const cutoffDate = new Date()
        cutoffDate.setFullYear(cutoffDate.getFullYear() - years)
        booksQuery = booksQuery.lte('created_at', cutoffDate.toISOString())
      }
    }

    if (publicationDateStart) {
      booksQuery = booksQuery.gte('publication_date', publicationDateStart)
    }

    if (publicationDateEnd) {
      booksQuery = booksQuery.lte('publication_date', publicationDateEnd)
    }

    const { data: books, error: booksError } = await booksQuery

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
    }

    // Get all borrowing records to count borrowed books
    const { data: borrowingRecords, error: borrowingError } = await supabase
      .from('borrowing_records')
      .select('book_id, status')
      .eq('status', 'borrowed')

    if (borrowingError) {
      console.error('Error fetching borrowing records:', borrowingError)
      // Continue without borrowing data if table doesn't exist
    }

    // Create a map of borrowed book IDs
    const borrowedBookIds = new Set(
      (borrowingRecords || []).map((record: any) => record.book_id)
    )

    // All subject categories
    const allSubjects = [
      'Thesis',
      'Fiction',
      'Medicine',
      'Agriculture',
      'Computer Studies',
      'Comics',
      'Mathematics',
      'Science',
      'Social Studies',
      'PEHM',
      'Values Education',
      'TLE'
    ]

    // Calculate statistics for each subject and group books
    const reportData: Record<string, { 
      total: number
      borrowed: number
      remaining: number
      books: Array<{ id: number; title: string; author: string; catalog_no: string | null }>
    }> = {}

    allSubjects.forEach((subject) => {
      const subjectBooks = (books || []).filter((book: any) => book.subject === subject)
      const total = subjectBooks.length
      const borrowed = subjectBooks.filter((book: any) => 
        !book.available || borrowedBookIds.has(book.id)
      ).length
      const remaining = total - borrowed

      // Get book details for this subject
      const bookDetails = subjectBooks.map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        catalog_no: book.catalog_no || null
      }))

      reportData[subject] = {
        total,
        borrowed,
        remaining,
        books: bookDetails
      }
    })

    // Calculate totals
    const grandTotal = {
      total: Object.values(reportData).reduce((sum, data) => sum + data.total, 0),
      borrowed: Object.values(reportData).reduce((sum, data) => sum + data.borrowed, 0),
      remaining: Object.values(reportData).reduce((sum, data) => sum + data.remaining, 0)
    }

    return NextResponse.json({
      success: true,
      report: {
        categories: reportData,
        totals: grandTotal,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

