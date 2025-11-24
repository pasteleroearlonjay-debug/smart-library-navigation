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

    // Fetch book requests for all members (if table exists)
    let bookRequests: any[] = []
    try {
      const { data, error: requestsError } = await supabase
        .from('book_requests')
        .select('member_id, status')
        .in('status', ['pending', 'approved', 'ready'])
      
      if (!requestsError && data) {
        bookRequests = data
      }
    } catch (e) {
      console.log('book_requests table may not exist, skipping...')
    }

    // Fetch unread notifications for all members (if table exists)
    let notifications: any[] = []
    try {
      const { data, error: notificationsError } = await supabase
        .from('user_notifications')
        .select('member_id, is_read')
        .eq('is_read', false)
      
      if (!notificationsError && data) {
        notifications = data
      }
    } catch (e) {
      console.log('user_notifications table may not exist, skipping...')
    }

    // Create maps for quick lookup
    const requestsByMember: Record<string, { active: number, ready: number }> = {}
    const notificationsByMember: Record<string, number> = {}

    // Count requests by member
    if (bookRequests) {
      bookRequests.forEach((req: any) => {
        const memberId = req.member_id
        if (!requestsByMember[memberId]) {
          requestsByMember[memberId] = { active: 0, ready: 0 }
        }
        if (req.status === 'pending' || req.status === 'approved') {
          requestsByMember[memberId].active++
        }
        if (req.status === 'ready') {
          requestsByMember[memberId].ready++
        }
      })
    }

    // Count unread notifications by member
    if (notifications) {
      notifications.forEach((notif: any) => {
        const memberId = notif.member_id
        notificationsByMember[memberId] = (notificationsByMember[memberId] || 0) + 1
      })
    }

    // Transform data for the frontend
    const users = members?.map(member => {
      const memberRequests = requestsByMember[member.id] || { active: 0, ready: 0 }
      const unreadCount = notificationsByMember[member.id] || 0
      
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        membershipId: member.membership_id || 'N/A',
        joinDate: member.join_date || member.created_at,
        borrowedBooks: member.borrowed_count || 0,
        overdueBooks: member.overdue_count || 0,
        activeRequests: memberRequests.active,
        readyRequests: memberRequests.ready,
        unreadNotifications: unreadCount,
        status: member.status || 'Active',
        emailVerified: member.email_verified || false,
        lastLogin: member.last_login || null,
        profilePicture: member.profile_picture_url || null
      }
    }) || []

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate PSAU iskwela account requirement - ONLY @iskwela.psau.edu.ph allowed
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',').map(d => d.trim()) || ['@iskwela.psau.edu.ph']
    const isAllowedDomain = allowedDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()))
    
    if (!isAllowedDomain) {
      return NextResponse.json(
        { error: 'iskwela account is required' },
        { status: 400 }
      )
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

