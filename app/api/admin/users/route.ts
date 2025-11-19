import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const adminUser = request.headers.get('x-admin-user')
    
    if (!adminToken || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all library members with their statistics
    const { data: members, error } = await supabase
      .from('library_members')
      .select(`
        *,
        borrowing_records!borrowing_records_member_id_fkey(
          id,
          book_title,
          due_date,
          status
        ),
        book_requests(
          id,
          book_title,
          status
        ),
        user_notifications(
          id,
          type,
          is_read
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Transform data for the frontend
    const users = members?.map(member => {
      const borrowedBooks = member.borrowing_records?.filter(br => br.status === 'borrowed').length || 0
      const overdueBooks = member.borrowing_records?.filter(br => 
        br.status === 'borrowed' && new Date(br.due_date) < new Date()
      ).length || 0
      const activeRequests = member.book_requests?.filter(br => br.status === 'pending').length || 0
      const readyRequests = member.book_requests?.filter(br => br.status === 'ready').length || 0
      const unreadNotifications = member.user_notifications?.filter(un => !un.is_read).length || 0

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        membershipId: member.membership_id,
        joinDate: member.join_date,
        borrowedBooks,
        overdueBooks,
        activeRequests,
        readyRequests,
        unreadNotifications,
        status: member.status,
        emailVerified: member.email_verified,
        lastLogin: member.last_login,
        profilePicture: member.profile_picture_url
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

    return NextResponse.json({ users, stats })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    if (!name || !email || !membershipId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate a temporary password (user will need to reset it)
    const tempPassword = 'TempPass123!'
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    // Insert new member
    const { data, error } = await supabase
      .from('library_members')
      .insert({
        name,
        email,
        membership_id: membershipId,
        password_hash: passwordHash,
        join_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        email_verified: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating member:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create welcome notification
    await supabase
      .from('user_notifications')
      .insert({
        member_id: data.id,
        type: 'welcome',
        title: 'Welcome to the Library!',
        message: `Welcome ${name}! Your account has been created. Please check your email to verify your account.`,
        is_read: false
      })

    return NextResponse.json({ 
      message: 'User created successfully',
      user: data,
      tempPassword 
    })
  } catch (error) {
    console.error('Error in create user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

