import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const adminUser = request.headers.get('x-admin-user')
    
    if (!adminToken || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching users from library_members table...')

    // Fetch all library members (simple query without complex joins)
    const { data: members, error } = await supabase
      .from('library_members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch users: ' + error.message,
        details: error
      }, { status: 500 })
    }

    console.log(`Found ${members?.length || 0} members`)

    // Transform data for the frontend
    const users = members?.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      membershipId: member.membership_id || 'N/A',
      joinDate: member.join_date || member.created_at,
      borrowedBooks: member.borrowed_count || 0,
      overdueBooks: member.overdue_count || 0,
      activeRequests: 0, // Will be updated when book_requests table is available
      readyRequests: 0,  // Will be updated when book_requests table is available
      unreadNotifications: 0, // Will be updated when user_notifications table is available
      status: member.status || 'Active',
      emailVerified: member.email_verified || false,
      lastLogin: member.last_login || null,
      profilePicture: member.profile_picture_url || null
    })) || []

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      activeMembers: users.filter(u => u.status === 'Active').length,
      totalBorrowed: users.reduce((sum, u) => sum + u.borrowedBooks, 0),
      totalOverdue: users.reduce((sum, u) => sum + u.overdueBooks, 0),
      totalRequests: users.reduce((sum, u) => sum + u.activeRequests + u.readyRequests, 0),
      emailVerified: users.filter(u => u.emailVerified).length
    }

    return NextResponse.json({ 
      users, 
      stats,
      message: 'Users fetched successfully'
    })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      details: error
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const adminUser = request.headers.get('x-admin-user')
    
    if (!adminToken || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, membershipId } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Generate membership ID if not provided
    const finalMembershipId = membershipId || `LIB${String(Date.now()).slice(-6)}`

    // Create a simple password hash (in production, use bcrypt)
    const tempPassword = 'TempPass123!'
    const passwordHash = Buffer.from(tempPassword).toString('base64') // Simple encoding for demo

    // Insert new member
    const { data, error } = await supabase
      .from('library_members')
      .insert({
        name,
        email,
        membership_id: finalMembershipId,
        password_hash: passwordHash,
        join_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        email_verified: false,
        borrowed_count: 0,
        overdue_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating member:', error)
      return NextResponse.json({ 
        error: 'Failed to create user: ' + error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: data,
      tempPassword 
    })
  } catch (error) {
    console.error('Error in create user API:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      details: error
    }, { status: 500 })
  }
}

