import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to get user ID from token
async function getUserIdFromToken(token: string): Promise<string | number | null> {
  try {
    // Try to decode base64 token (format: base64(userId:timestamp))
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [userId] = decoded.split(':')
      if (userId) {
        return userId
      }
    } catch (e) {
      // Token might be Supabase session token, try to get user from Supabase
    }

    // Try to get user from Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (user && !error) {
      return user.id
    }

    return null
  } catch (error) {
    console.error('Error getting user ID from token:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      )
    }

    // Get user ID from token
    const userId = await getUserIdFromToken(token)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token or user not found' },
        { status: 401 }
      )
    }

    const normalizedUserId =
      typeof userId === 'string' && !isNaN(Number(userId)) ? Number(userId) : userId

    // Fetch notifications from database
    const { data: notifications, error: notificationsError } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('member_id', normalizedUserId)
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      // If table doesn't exist, return empty array for new users
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        overdueItems: 0,
        dueSoonItems: 0,
        readyBooksCount: 0,
        collectedBooksCount: 0
      })
    }

    // Count unread notifications
    const unreadCount = notifications?.filter(n => !n.is_read).length || 0

    // Calculate stats from database
    let overdueCount = 0
    let dueSoonCount = 0
    let readyBooksCount = 0
    let collectedBooksCount = 0
    let booksBorrowed = 0
    let dueSoonBooks: Array<{
      id: number
      bookId: number | null
      title: string
      dueDate: string
      hoursUntilDue: number
      status: 'due_soon' | 'overdue'
    }> = []

    try {
      const now = new Date()
      const { data: borrowingRecords } = await supabase
        .from('borrowing_records')
        .select('*')
        .eq('member_id', normalizedUserId)

      if (borrowingRecords && borrowingRecords.length > 0) {
        const activeRecords = borrowingRecords.filter(record =>
          ['borrowed', 'overdue'].includes((record.status || '').toLowerCase())
        )
        booksBorrowed = activeRecords.length

        const hourMs = 1000 * 60 * 60
        const overdueRecords = activeRecords.filter(record => {
          if (!record.due_date) return false
          return new Date(record.due_date).getTime() < now.getTime()
        })
        overdueCount = overdueRecords.length

        const dueSoonRecords = activeRecords.filter(record => {
          if (!record.due_date) return false
          const diffMs = new Date(record.due_date).getTime() - now.getTime()
          return diffMs >= 0 && diffMs <= hourMs * 24
        })
        dueSoonCount = dueSoonRecords.length
        dueSoonBooks = dueSoonRecords.map(record => {
          const dueDate = new Date(record.due_date!)
          const diffMs = dueDate.getTime() - now.getTime()
          const diffHours = Math.ceil(diffMs / hourMs)
          return {
            id: record.id,
            bookId: record.book_id,
            title: record.book_title || `Book ID: ${record.book_id}`,
            dueDate: record.due_date!,
            hoursUntilDue: Math.max(diffHours, 0),
            status: diffMs < 0 ? 'overdue' : 'due_soon'
          }
        })
      }
    } catch (e) {
      // Table might not exist, ignore
    }

    try {
      const readyBooksResult = await supabase
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', normalizedUserId)
        .eq('status', 'ready')
      readyBooksCount = readyBooksResult.count || 0
    } catch (e) {
      // Table might not exist, ignore
    }

    try {
      const collectedBooksResult = await supabase
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', normalizedUserId)
        .eq('status', 'collected')
      collectedBooksCount = collectedBooksResult.count || 0
    } catch (e) {
      // Table might not exist, ignore
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
      overdueItems: overdueCount,
      dueSoonItems: dueSoonCount,
      readyBooksCount,
      collectedBooksCount,
      booksBorrowed,
      dueSoonBooks
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
