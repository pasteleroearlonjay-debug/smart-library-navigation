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

    // Normalize user ID - try both string and number formats
    let normalizedUserId: string | number = userId
    if (typeof userId === 'string') {
      // Try to convert to number if it's a numeric string
      const numId = Number(userId)
      if (!isNaN(numId)) {
        normalizedUserId = numId
      }
    }

    console.log(`Fetching notifications for user ID: ${normalizedUserId} (original: ${userId}, type: ${typeof normalizedUserId})`)

    // Try querying with both string and number formats to handle any ID type mismatches
    let notifications: any[] = []
    let notificationsError: any = null

    // First try with normalized ID
    const { data: notifications1, error: error1 } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('member_id', normalizedUserId)
      .order('created_at', { ascending: false })

    if (error1) {
      console.error('Error fetching notifications with normalized ID:', error1)
      // Try with original userId as fallback
      const { data: notifications2, error: error2 } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('member_id', userId)
        .order('created_at', { ascending: false })
      
      if (error2) {
        console.error('Error fetching notifications with original ID:', error2)
        notificationsError = error2
      } else {
        notifications = notifications2 || []
        console.log(`Found ${notifications.length} notifications using original userId`)
      }
    } else {
      notifications = notifications1 || []
      console.log(`Found ${notifications.length} notifications using normalized userId`)
    }

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
      const hourMs = 1000 * 60 * 60
      const dayMs = hourMs * 24
      
      // Get books from borrowing_records
      const { data: borrowingRecords } = await supabase
        .from('borrowing_records')
        .select('*')
        .eq('member_id', normalizedUserId)

      if (borrowingRecords && borrowingRecords.length > 0) {
        const activeRecords = borrowingRecords.filter(record =>
          ['borrowed', 'overdue'].includes((record.status || '').toLowerCase())
        )
        booksBorrowed = activeRecords.length

        const overdueRecords = activeRecords.filter(record => {
          if (!record.due_date) return false
          return new Date(record.due_date).getTime() < now.getTime()
        })
        overdueCount = overdueRecords.length

        const dueSoonRecords = activeRecords.filter(record => {
          if (!record.due_date) return false
          const diffMs = new Date(record.due_date).getTime() - now.getTime()
          return diffMs >= 0 && diffMs <= dayMs
        })
        dueSoonCount = dueSoonRecords.length
        
        // Add borrowing records to dueSoonBooks
        dueSoonBooks.push(...dueSoonRecords.map(record => {
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
        }))
      }
      
      // Also get books from book_requests that are approved/accepted/ready/collected with due dates
      const { data: bookRequests } = await supabase
        .from('book_requests')
        .select('*')
        .eq('member_id', normalizedUserId)
        .in('status', ['accepted', 'approved', 'ready', 'collected'])

      if (bookRequests && bookRequests.length > 0) {
        const requestsWithDueDates = bookRequests.filter(request => {
          if (!request.due_date) return false
          const diffMs = new Date(request.due_date).getTime() - now.getTime()
          // Include if due within 24 hours or overdue
          return diffMs <= dayMs
        })
        
        // Add book requests to dueSoonBooks (avoid duplicates)
        const existingIds = new Set(dueSoonBooks.map(b => b.id))
        requestsWithDueDates.forEach(request => {
          const dueDate = new Date(request.due_date!)
          const diffMs = dueDate.getTime() - now.getTime()
          const diffHours = Math.ceil(diffMs / hourMs)
          const requestId = `request-${request.id}`
          
          if (!existingIds.has(requestId)) {
            dueSoonBooks.push({
              id: request.id,
              bookId: request.book_id,
              title: request.book_title || `Book ID: ${request.book_id}`,
              dueDate: request.due_date!,
              hoursUntilDue: Math.max(diffHours, 0),
              status: diffMs < 0 ? 'overdue' : 'due_soon'
            })
            existingIds.add(requestId)
          }
        })
        
        // Update dueSoonCount to include book requests
        dueSoonCount = dueSoonBooks.filter(b => b.status === 'due_soon').length
        overdueCount += dueSoonBooks.filter(b => b.status === 'overdue').length
      }
    } catch (e) {
      console.error('Error fetching due soon books:', e)
      // Table might not exist, ignore
    }

    try {
      // Try with normalized ID first
      let readyResult = await supabase
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', normalizedUserId)
        .eq('status', 'ready')
      
      if (readyResult.error && typeof userId !== typeof normalizedUserId) {
        // Try with original userId if types don't match
        readyResult = await supabase
          .from('book_requests')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', userId)
          .eq('status', 'ready')
      }
      
      readyBooksCount = readyResult.count || 0
      console.log(`Ready books count: ${readyBooksCount} for user ${normalizedUserId}`)
    } catch (e) {
      console.error('Error fetching ready books:', e)
      // Table might not exist, ignore
    }

    try {
      // Try with normalized ID first
      let collectedResult = await supabase
        .from('book_requests')
        .select('*', { count: 'exact', head: true })
        .eq('member_id', normalizedUserId)
        .eq('status', 'collected')
      
      if (collectedResult.error && typeof userId !== typeof normalizedUserId) {
        // Try with original userId if types don't match
        collectedResult = await supabase
          .from('book_requests')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', userId)
          .eq('status', 'collected')
      }
      
      collectedBooksCount = collectedResult.count || 0
      console.log(`Collected books count: ${collectedBooksCount} for user ${normalizedUserId}`)
    } catch (e) {
      console.error('Error fetching collected books:', e)
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
