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
    // Get all books grouped by subject
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, subject, available')

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

    // Calculate statistics for each subject
    const reportData: Record<string, { total: number; borrowed: number; remaining: number }> = {}

    allSubjects.forEach((subject) => {
      const subjectBooks = (books || []).filter((book: any) => book.subject === subject)
      const total = subjectBooks.length
      const borrowed = subjectBooks.filter((book: any) => 
        !book.available || borrowedBookIds.has(book.id)
      ).length
      const remaining = total - borrowed

      reportData[subject] = {
        total,
        borrowed,
        remaining
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

