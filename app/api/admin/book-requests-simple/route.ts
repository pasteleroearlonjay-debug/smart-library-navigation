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

    // Try to fetch from book_requests table
    try {
      const { data: requests, error } = await supabase
        .from('book_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.log('Table access error:', error.message)
        // If it's a column error, try a simpler query
        if (error.message.includes('column') || error.message.includes('schema')) {
          console.log('Trying simpler query without problematic columns')
          const { data: simpleRequests, error: simpleError } = await supabase
            .from('book_requests')
            .select('id, member_id, book_id, status, request_date, requested_days, due_date, created_at')
            .order('created_at', { ascending: false })

          if (simpleError) {
            console.log('Simple query also failed:', simpleError.message)
            return NextResponse.json({
              success: true,
              requests: [],
              stats: {
                totalRequests: 0,
                pendingRequests: 0,
                approvedRequests: 0,
                declinedRequests: 0
              },
              message: 'Database access issue. Please check your book_requests table structure.'
            })
          }

          // Calculate stats from simple data
          const stats = {
            totalRequests: simpleRequests?.length || 0,
            pendingRequests: simpleRequests?.filter(r => r.status === 'pending').length || 0,
            approvedRequests: simpleRequests?.filter(r => r.status === 'approved').length || 0,
            declinedRequests: simpleRequests?.filter(r => r.status === 'declined').length || 0
          }

          return NextResponse.json({
            success: true,
            requests: simpleRequests || [],
            stats
          })
        }

        // Return empty results if table doesn't exist or has issues
        return NextResponse.json({
          success: true,
          requests: [],
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            declinedRequests: 0
          },
          message: 'Please check your book_requests table structure'
        })
      }

      // Calculate stats
      const stats = {
        totalRequests: requests?.length || 0,
        pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
        approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
        declinedRequests: requests?.filter(r => r.status === 'declined').length || 0
      }

      return NextResponse.json({
        success: true,
        requests: requests || [],
        stats
      })

    } catch (tableError) {
      console.log('Table error:', tableError)
      return NextResponse.json({
        success: true,
        requests: [],
        stats: {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          declinedRequests: 0
        },
        message: 'Database setup required. Please run TEST_SIMPLE_SETUP.sql'
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
      message: 'System error. Please run TEST_SIMPLE_SETUP.sql'
    })
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

    // Try to update the request
    try {
      const newStatus = action === 'approve' ? 'approved' : 'declined'
      
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
        console.log('Update error:', error.message)
        return NextResponse.json(
          { error: 'Database setup required. Please run TEST_SIMPLE_SETUP.sql' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Book request ${action}d successfully`,
        request: updatedRequest
      })

    } catch (updateError) {
      console.log('Update error:', updateError)
      return NextResponse.json(
        { error: 'Database setup required. Please run TEST_SIMPLE_SETUP.sql' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
