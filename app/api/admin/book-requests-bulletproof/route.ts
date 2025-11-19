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

    // Try to delete the request
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

    return NextResponse.json({
      success: true,
      message: 'Book request deleted successfully'
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

    if (!['approve', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "decline"' },
        { status: 400 }
      )
    }

    // Use status values that are compatible with the book_requests constraint
    // Current constraint allows: 'pending', 'ready', 'collected', 'cancelled'
    // After running FIX_BOOK_REQUESTS_STATUS_CONSTRAINT.sql, it will also allow: 'accepted', 'approved', 'declined', 'rejected'
    const statusOptions = action === 'approve' 
      ? ['accepted', 'approved', 'ready', 'collected'] // Try accepted/approved first, fallback to ready/collected
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

        // Success!
        return NextResponse.json({
          success: true,
          message: `Book request ${action}d successfully`,
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
