import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Basic admin authentication check
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch from book_requests table directly
    const { data: requests, error } = await supabase
      .from('book_requests')
      .select('*')
      .order('request_date', { ascending: false })

    // If requests exist, try to get user and book details separately
    let enrichedRequests = requests || []
    if (requests && requests.length > 0) {
      // Get unique member IDs and book IDs
      const memberIds = [...new Set(requests.map(r => r.member_id))]
      const bookIds = [...new Set(requests.map(r => r.book_id))]

      // Fetch member details
      let members = {}
      try {
        const { data: memberData } = await supabase
          .from('library_members')
          .select('id, name, email')
          .in('id', memberIds)
        
        if (memberData) {
          members = memberData.reduce((acc, member) => {
            acc[member.id] = member
            return acc
          }, {})
        }
      } catch (memberError) {
        console.log('Could not fetch member details:', memberError)
      }

      // Fetch book details
      let books = {}
      try {
        const { data: bookData } = await supabase
          .from('books')
          .select('id, title, author, subject')
          .in('id', bookIds)
        
        if (bookData) {
          books = bookData.reduce((acc, book) => {
            acc[book.id] = book
            return acc
          }, {})
        }
      } catch (bookError) {
        console.log('Could not fetch book details:', bookError)
      }

      // Enrich requests with member and book details
      enrichedRequests = requests.map(request => ({
        ...request,
        library_members: members[request.member_id] || { id: request.member_id, name: 'Unknown User', email: 'unknown@example.com' },
        books: books[request.book_id] || { id: request.book_id, title: 'Unknown Book', author: 'Unknown Author', subject: 'Unknown' }
      }))
    }

    if (error) {
      console.error('Error fetching book requests:', error)
      // If table doesn't exist or any other error, return empty results
      return NextResponse.json({
        success: true,
        requests: [],
        stats: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          declinedRequests: 0
        },
        message: 'Database tables need to be set up. Please run SAFE_BOOK_REQUESTS_SETUP.sql'
      })
    }

    // Calculate stats from real data
    const stats = {
      totalRequests: enrichedRequests?.length || 0,
      pendingRequests: enrichedRequests?.filter(r => r.status === 'pending').length || 0,
      approvedRequests: enrichedRequests?.filter(r => r.status === 'approved').length || 0,
      declinedRequests: enrichedRequests?.filter(r => r.status === 'declined').length || 0
    }

    return NextResponse.json({
      success: true,
      requests: enrichedRequests || [],
      stats
    })

  } catch (error) {
    console.error('Book requests API error:', error)
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

    if (!['approve', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "decline"' },
        { status: 400 }
      )
    }

    // Get the request details first
    const { data: requestData, error: fetchError } = await supabase
      .from('book_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !requestData) {
      console.error('Error fetching book request:', fetchError)
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check if request is already processed
    if (requestData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'declined'

    // If approving, try to use the database function first, then fallback to manual update
    if (action === 'approve') {
      // Try to call the database function (if it exists)
      try {
        const { data: functionResult, error: functionError } = await supabase
          .rpc('approve_book_request', { request_id: requestId })

        if (!functionError && functionResult) {
          // Function succeeded, fetch the updated request
          const { data: updatedRequest } = await supabase
            .from('book_requests')
            .select('*')
            .eq('id', requestId)
            .single()

          if (updatedRequest) {
            // Continue with notification creation below
            const updatedRequestForResponse = updatedRequest
            // Skip to notification creation
            try {
              let bookTitle = 'the requested book'
              try {
                const { data: bookData } = await supabase
                  .from('books')
                  .select('title')
                  .eq('id', updatedRequestForResponse.book_id)
                  .single()
                if (bookData) {
                  bookTitle = `"${bookData.title}"`
                }
              } catch (bookError) {
                console.log('Could not fetch book title for notification')
              }

              await supabase
                .from('user_notifications')
                .insert({
                  member_id: updatedRequestForResponse.member_id,
                  type: 'book_approved',
                  title: 'Book Request Approved',
                  message: `Your request for ${bookTitle} has been approved! You can now pick up the book.`,
                  is_read: false
                })
            } catch (notificationError) {
              console.log('Note: Could not create notification (table might not exist)')
            }

            return NextResponse.json({
              success: true,
              message: 'Book request approved successfully',
              request: updatedRequestForResponse
            })
          }
        }
      } catch (rpcError) {
        console.log('Database function not available, using manual update:', rpcError)
      }

      // Fallback: Manual update if function doesn't exist
      // First, check if book has available quantity
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

    // Update request status
    const { data: updatedRequest, error } = await supabase
      .from('book_requests')
      .update({ 
        status: newStatus,
        processed_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', requestId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating book request:', error)
      return NextResponse.json(
        { error: 'Failed to update request: ' + error.message },
        { status: 500 }
      )
    }

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Create notification for user (optional - won't fail if table doesn't exist)
    try {
      // Get book title for notification
      let bookTitle = 'the requested book'
      try {
        const { data: bookData } = await supabase
          .from('books')
          .select('title')
          .eq('id', updatedRequest.book_id)
          .single()
        if (bookData) {
          bookTitle = `"${bookData.title}"`
        }
      } catch (bookError) {
        console.log('Could not fetch book title for notification')
      }

      const notificationMessage = action === 'approve' 
        ? `Your request for ${bookTitle} has been approved! You can now pick up the book.`
        : `Your request for ${bookTitle} has been declined. Please contact the library for more information.`

      await supabase
        .from('user_notifications')
        .insert({
          member_id: updatedRequest.member_id,
          type: action === 'approve' ? 'book_approved' : 'book_declined',
          title: action === 'approve' ? 'Book Request Approved' : 'Book Request Declined',
          message: notificationMessage,
          is_read: false
        })
    } catch (notificationError) {
      console.log('Note: Could not create notification (table might not exist)')
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: `Book request ${action}d successfully`,
      request: updatedRequest
    })

  } catch (error) {
    console.error('Update book request API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
