import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

type AdminAction = 'approve' | 'decline' | 'collect'

interface RequestContext {
  request: any
  member: { id: number; name?: string | null; email?: string | null } | null
  book: { title?: string | null; author?: string | null } | null
}

const NOTIFICATION_TEMPLATES: Record<
  AdminAction,
  {
    type: string
    title: string
    buildMessage: (context: RequestContext) => { message: string; emailSubject: string; emailBody: string }
  }
> = {
  approve: {
    type: 'book_approved',
    title: 'Book Request Approved',
    buildMessage: ({ request, member, book }) => {
      const bookTitle = request.book_title || book?.title || 'your requested book'
      const dueDateText = request.due_date
        ? new Date(request.due_date).toLocaleDateString()
        : 'the scheduled due date'
      const greeting = member?.name ? `Hi ${member.name},` : 'Hello,'
      const message = `Your request for "${bookTitle}" was approved. Please pick up the book within the next few days. Due date: ${dueDateText}.`
      const emailBody = `${greeting}

${message}

Borrowing period: ${request.requested_days || 'N/A'} day(s).

Happy reading!
PSAU Library System`

      return {
        message,
        emailSubject: 'Your book request has been approved',
        emailBody
      }
    }
  },
  decline: {
    type: 'book_declined',
    title: 'Book Request Declined',
    buildMessage: ({ request, member, book }) => {
      const bookTitle = request.book_title || book?.title || 'your requested book'
      const greeting = member?.name ? `Hi ${member.name},` : 'Hello,'
      const message = `We’re sorry, but your request for "${bookTitle}" could not be approved at this time. Please reach out to the librarian for assistance or request another title.`
      const emailBody = `${greeting}

${message}

Thank you for understanding.
PSAU Library System`

      return {
        message,
        emailSubject: 'Your book request could not be approved',
        emailBody
      }
    }
  },
  collect: {
    type: 'book_received',
    title: 'Book Pickup Confirmed',
    buildMessage: ({ request, member, book }) => {
      const bookTitle = request.book_title || book?.title || 'your book'
      const dueDateText = request.due_date
        ? new Date(request.due_date).toLocaleDateString()
        : 'the scheduled due date'
      const greeting = member?.name ? `Hi ${member.name},` : 'Hello,'
      const message = `We’ve recorded that you picked up "${bookTitle}". Please enjoy reading and return it by ${dueDateText}.`
      const emailBody = `${greeting}

${message}

PSAU Library System`

      return {
        message,
        emailSubject: 'Enjoy your book!',
        emailBody
      }
    }
  }
}

async function fetchRequestContext(request: any): Promise<RequestContext> {
  const [memberResult, bookResult] = await Promise.allSettled([
    request?.member_id
      ? supabase
          .from('library_members')
          .select('id, name, email')
          .eq('id', request.member_id)
          .single()
      : Promise.resolve({ data: null }),
    request?.book_id
      ? supabase
          .from('books')
          .select('id, title, author')
          .eq('id', request.book_id)
          .single()
      : Promise.resolve({ data: null })
  ])

  const member =
    memberResult.status === 'fulfilled' && !memberResult.value.error
      ? (memberResult.value.data as { id: number; name?: string | null; email?: string | null })
      : null
  const book =
    bookResult.status === 'fulfilled' && !bookResult.value.error
      ? (bookResult.value.data as { title?: string | null; author?: string | null })
      : null

  return {
    request,
    member,
    book
  }
}

async function createNotificationAndEmail(action: AdminAction, context: RequestContext) {
  try {
    const template = NOTIFICATION_TEMPLATES[action]
    if (!template || !context.request?.member_id) {
      console.log('Cannot create notification: missing template or member_id', { action, member_id: context.request?.member_id })
      return
    }

    const { message, emailSubject, emailBody } = template.buildMessage(context)
    console.log(`Creating notification for member ${context.request.member_id}, action: ${action}`)
    
    const { data: insertedNotification, error: notificationError } = await supabase
      .from('user_notifications')
      .insert({
        member_id: context.request.member_id,
        type: template.type,
        title: template.title,
        message,
        related_request_id: context.request.id,
        is_read: false
      })
      .select('id')
      .single()

    if (notificationError) {
      console.error('Failed to create user notification:', notificationError)
      console.error('Notification error details:', {
        member_id: context.request.member_id,
        type: template.type,
        error: notificationError.message
      })
      // Don't return - still try to send email if possible
    } else {
      console.log(`Notification created successfully: ID ${insertedNotification?.id}`)
    }

    const recipientEmail = context.request.user_email || context.member?.email
    if (!recipientEmail) {
      console.log(`No email found for member ${context.request.member_id}, skipping email send`)
      return
    }

    try {
      const emailResponse = await fetch(`${APP_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          message: emailBody,
          type: template.type,
          userId: context.request.member_id,
          bookId: context.request.book_id
        })
      })

      if (emailResponse.ok && insertedNotification?.id) {
        await supabase
          .from('user_notifications')
          .update({ emailed_at: new Date().toISOString() })
          .eq('id', insertedNotification.id)
        console.log(`Email sent and notification marked as emailed for notification ID ${insertedNotification.id}`)
      } else if (!emailResponse.ok) {
        const errorBody = await emailResponse.text()
        console.error('Failed to send approval email:', errorBody)
      }
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Notification was still created, so this is not a fatal error
    }
  } catch (error) {
    console.error('Failed to create notification/email:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Basic admin authentication check
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try the most basic query possible
    try {
      console.log('Attempting basic book_requests query...')
      const { data: requests, error } = await supabase
        .from('book_requests')
        .select(`
          id, 
          member_id, 
          book_id, 
          status, 
          request_date, 
          requested_days, 
          due_date, 
          created_at,
          book_title,
          book_author,
          book_subject,
          user_name,
          user_email
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Basic query error:', error)
        // If even the basic query fails, return empty results
        return NextResponse.json({
          success: true,
          requests: [],
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            declinedRequests: 0
          },
          message: 'Unable to access book_requests table. Please check database connection.'
        })
      }

      console.log('Basic query successful, found', requests?.length || 0, 'requests')

      // Enrich requests with user and book data if needed
      let enrichedRequests = requests || []
      
      if (enrichedRequests.length > 0 && (!enrichedRequests[0].book_title || !enrichedRequests[0].user_name)) {
        console.log('Enriching requests with user and book data...')
        
        // Get unique member IDs and book IDs
        const memberIds = [...new Set(enrichedRequests.map(r => r.member_id).filter(Boolean))]
        const bookIds = [...new Set(enrichedRequests.map(r => r.book_id).filter(Boolean))]
        
        // Fetch user information
        const { data: users } = await supabase
          .from('library_members')
          .select('id, name, email')
          .in('id', memberIds)
        
        // Fetch book information
        const { data: books } = await supabase
          .from('books')
          .select('id, title, author')
          .in('id', bookIds)
        
        // Create lookup maps
        const userMap = new Map(users?.map(u => [u.id, u]) || [])
        const bookMap = new Map(books?.map(b => [b.id, b]) || [])
        
        // Enrich requests with user and book data
        enrichedRequests = enrichedRequests.map(request => ({
          ...request,
          user_name: request.user_name || userMap.get(request.member_id)?.name || `User ${request.member_id}`,
          user_email: request.user_email || userMap.get(request.member_id)?.email || `user${request.member_id}@example.com`,
          book_title: request.book_title || bookMap.get(request.book_id)?.title || `Book ID: ${request.book_id}`,
          book_author: request.book_author || bookMap.get(request.book_id)?.author || 'Unknown Author'
        }))
      }

      // Calculate stats
      const stats = {
        totalRequests: enrichedRequests.length,
        pendingRequests: enrichedRequests.filter(r => r.status === 'pending').length,
        approvedRequests: enrichedRequests.filter(r => r.status === 'approved' || r.status === 'accepted').length,
        declinedRequests: enrichedRequests.filter(r => r.status === 'declined' || r.status === 'cancelled').length
      }

      return NextResponse.json({
        success: true,
        requests: enrichedRequests,
        stats
      })

    } catch (queryError) {
      console.error('Query execution error:', queryError)
      return NextResponse.json({
        success: true,
        requests: [],
        stats: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          declinedRequests: 0
        },
        message: 'Query execution failed. Please check your database setup.'
      })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: true,
      requests: [],
      stats: {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        declinedRequests: 0
      },
      message: 'Internal server error. Please try again.'
    })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Basic admin authentication check
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // First, get the request details before deleting (for cascading deletes)
    const { data: requestData, error: fetchError } = await supabase
      .from('book_requests')
      .select('id, member_id, book_id, due_date')
      .eq('id', requestId)
      .single()

    if (fetchError || !requestData) {
      console.error('Request not found:', fetchError)
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Delete related notifications first
    try {
      const { error: notificationError } = await supabase
        .from('user_notifications')
        .delete()
        .eq('related_request_id', requestId)

      if (notificationError) {
        console.error('Error deleting notifications:', notificationError)
        // Continue with deletion even if notifications fail
      } else {
        console.log(`Deleted notifications related to request ${requestId}`)
      }
    } catch (notificationException) {
      console.error('Exception deleting notifications:', notificationException)
      // Continue with deletion
    }

    // Delete related borrowing records (if they exist)
    // Match by member_id, book_id, and due_date for precise deletion
    try {
      if (requestData.due_date) {
        const { data: borrowingRecords, error: borrowFetchError } = await supabase
          .from('borrowing_records')
          .select('id')
          .eq('member_id', requestData.member_id)
          .eq('book_id', requestData.book_id)
          .eq('due_date', requestData.due_date)

        if (!borrowFetchError && borrowingRecords && borrowingRecords.length > 0) {
          // Delete borrowing records that match this request (same member, book, and due date)
          const { error: borrowDeleteError } = await supabase
            .from('borrowing_records')
            .delete()
            .eq('member_id', requestData.member_id)
            .eq('book_id', requestData.book_id)
            .eq('due_date', requestData.due_date)

          if (borrowDeleteError) {
            console.error('Error deleting borrowing records:', borrowDeleteError)
            // Continue with deletion even if borrowing records fail
          } else {
            console.log(`Deleted ${borrowingRecords.length} borrowing record(s) related to request ${requestId}`)
          }
        } else {
          // If no exact match, try without due_date (fallback for older records)
          const { data: fallbackRecords, error: fallbackError } = await supabase
            .from('borrowing_records')
            .select('id')
            .eq('member_id', requestData.member_id)
            .eq('book_id', requestData.book_id)
            .eq('status', 'borrowed') // Only delete active borrowings

          if (!fallbackError && fallbackRecords && fallbackRecords.length > 0) {
            const { error: fallbackDeleteError } = await supabase
              .from('borrowing_records')
              .delete()
              .eq('member_id', requestData.member_id)
              .eq('book_id', requestData.book_id)
              .eq('status', 'borrowed')

            if (!fallbackDeleteError) {
              console.log(`Deleted ${fallbackRecords.length} borrowing record(s) (fallback match) related to request ${requestId}`)
            }
          }
        }
      }
    } catch (borrowException) {
      console.error('Exception deleting borrowing records:', borrowException)
      // Continue with deletion
    }

    // Finally, delete the book request itself
    const { error } = await supabase
      .from('book_requests')
      .delete()
      .eq('id', requestId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete request: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Successfully deleted book request ${requestId} and all related data`)
    return NextResponse.json({
      success: true,
      message: 'Book request and all related data deleted successfully'
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Basic admin authentication check
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, action } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      )
    }

    const allowedActions = ['approve', 'decline', 'collect'] as AdminAction[]

    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve", "decline", or "collect"' },
        { status: 400 }
      )
    }

    // Get the request details first to check status and get book_id
    const { data: requestData, error: fetchError } = await supabase
      .from('book_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if request is already processed (if it's not pending/ready)
    const pendingStatuses = ['pending', 'ready']
    if (!pendingStatuses.includes(requestData.status) && action !== 'collect') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // If approving, update book quantity before updating request status
    if (action === 'approve') {
      // Check if book has available quantity
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, quantity, available')
        .eq('id', requestData.book_id)
        .single()

      if (bookError || !book) {
        return NextResponse.json(
          { error: 'Book not found' },
          { status: 404 }
        )
      }

      // Check if book is available and has quantity > 0
      const currentQuantity = book.quantity || 0
      if (currentQuantity <= 0 || !book.available) {
        return NextResponse.json(
          { error: 'Book is not available for borrowing (no copies available)' },
          { status: 400 }
        )
      }

      // Update book quantity and availability
      const newQuantity = currentQuantity - 1
      const { error: bookUpdateError } = await supabase
        .from('books')
        .update({
          quantity: newQuantity,
          available: newQuantity > 0
        })
        .eq('id', requestData.book_id)

      if (bookUpdateError) {
        console.error('Error updating book quantity:', bookUpdateError)
        return NextResponse.json(
          { error: 'Failed to update book quantity: ' + bookUpdateError.message },
          { status: 500 }
        )
      }

      // Create borrowing record (if table exists)
      try {
        await supabase
          .from('borrowing_records')
          .insert({
            member_id: requestData.member_id,
            book_id: requestData.book_id,
            borrowed_date: new Date().toISOString().split('T')[0],
            due_date: requestData.due_date,
            status: 'borrowed'
          })
      } catch (borrowingError) {
        console.log('Note: Could not create borrowing record (table might not exist)')
      }
    }

    // Use status values that are compatible with the book_requests constraint
    // Current constraint allows: 'pending', 'ready', 'collected', 'cancelled'
    // After running FIX_BOOK_REQUESTS_STATUS_CONSTRAINT.sql, it will also allow: 'accepted', 'approved', 'declined', 'rejected'
    const statusOptions =
      action === 'approve'
        ? ['accepted', 'approved', 'ready', 'collected'] // Try accepted/approved first, fallback to ready/collected
        : action === 'collect'
        ? ['collected']
        : ['cancelled', 'declined', 'rejected'] // Use cancelled as primary decline status
    
    console.log(`Trying ${statusOptions.length} status values for ${action} action`)

    let lastError = null
    
    for (const statusValue of statusOptions) {
      try {
        console.log(`Trying status value: ${statusValue}`)
        
        const { data: updatedRequest, error } = await supabase
          .from('book_requests')
          .update({ 
            status: statusValue,
            processed_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', requestId)
          .select('*')
          .single()

        if (error) {
          console.log(`Status ${statusValue} failed:`, error.message)
          lastError = error
          continue // Try next status value
        }

        const context = await fetchRequestContext(updatedRequest)
        await createNotificationAndEmail(action, context)

        return NextResponse.json({
          success: true,
          message:
            action === 'collect'
              ? 'Book marked as collected successfully'
              : `Book request ${action}d successfully`,
          request: updatedRequest
        })

      } catch (updateError) {
        console.log(`Status ${statusValue} failed with exception:`, updateError)
        lastError = updateError
        continue // Try next status value
      }
    }

    // If we get here, all status values failed
    console.error('All status values failed. Last error:', lastError)
    return NextResponse.json(
      { error: `Failed to update request. Tried status values: ${statusOptions.join(', ')}. Last error: ${lastError?.message || 'Unknown error'}` },
      { status: 500 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
