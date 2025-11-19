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

    // For demo purposes, if no books exist, return sample books
    if (!books || books.length === 0) {
      const sampleBooks = [
        {
          id: 1,
          title: "Advanced Mathematics",
          author: "Dr. Smith",
          subject: "Mathematics",
          isbn: "978-1234567890",
          available: true,
          quantity: 3,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: "Physics Principles",
          author: "Prof. Johnson",
          subject: "Science",
          isbn: "978-1234567891",
          available: true,
          quantity: 2,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          title: "World History",
          author: "Dr. Brown",
          subject: "Social Studies",
          isbn: "978-1234567892",
          available: true,
          quantity: 4,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          title: "Chemistry Basics",
          author: "Prof. Davis",
          subject: "Science",
          isbn: "978-1234567893",
          available: false,
          quantity: 0,
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          title: "Health & Fitness",
          author: "Dr. Wilson",
          subject: "PEHM",
          isbn: "978-1234567894",
          available: true,
          quantity: 2,
          created_at: new Date().toISOString()
        },
        {
          id: 6,
          title: "Moral Values",
          author: "Prof. Taylor",
          subject: "Values Education",
          isbn: "978-1234567895",
          available: true,
          quantity: 3,
          created_at: new Date().toISOString()
        }
      ]

      return NextResponse.json({
        success: true,
        books: sampleBooks
      })
    }

    return NextResponse.json({
      success: true,
      books: books
    })

  } catch (error) {
    console.error('Books API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

