import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Books count
    const { count: booksCount } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })

    // Active users: library_members with status Active
    const { count: activeUsers } = await supabase
      .from('library_members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')

    // Borrowed count: borrowing_records status borrowed
    const { count: borrowedCount } = await supabase
      .from('borrowing_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'borrowed')

    // Overdue count: borrowing_records status overdue
    const { count: overdueCount } = await supabase
      .from('borrowing_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    return NextResponse.json({
      books: booksCount || 0,
      activeUsers: activeUsers || 0,
      borrowed: borrowedCount || 0,
      overdue: overdueCount || 0,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}


