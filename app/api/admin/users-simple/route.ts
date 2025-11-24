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

    // Fetch borrowing records for real borrowed/overdue counts
    let borrowingRecords: any[] = []
    try {
      const { data, error: borrowingError } = await supabase
        .from('borrowing_records')
        .select('member_id, status, due_date')
      
      if (!borrowingError && data) {
        borrowingRecords = data
      }
    } catch (e) {
      console.log('borrowing_records table may not exist, skipping...')
    }

    // Create maps for quick lookup
    const requestsByMember: Record<string, { active: number, ready: number }> = {}
    const borrowedByMember: Record<string, number> = {}
    const overdueByMember: Record<string, number> = {}

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

    // Calculate real borrowed and overdue counts from borrowing_records
    if (borrowingRecords) {
      const today = new Date().toISOString().split('T')[0]
      borrowingRecords.forEach((record: any) => {
        const memberId = record.member_id
        if (record.status === 'borrowed') {
          borrowedByMember[memberId] = (borrowedByMember[memberId] || 0) + 1
          // Check if overdue (due_date < today and status is borrowed)
          if (record.due_date < today) {
            overdueByMember[memberId] = (overdueByMember[memberId] || 0) + 1
          }
        } else if (record.status === 'overdue') {
          overdueByMember[memberId] = (overdueByMember[memberId] || 0) + 1
          borrowedByMember[memberId] = (borrowedByMember[memberId] || 0) + 1
        }
      })
    }

    // Transform data for the frontend
    const users = members?.map(member => {
      const memberRequests = requestsByMember[member.id] || { active: 0, ready: 0 }
      // Use real counts from borrowing_records, fallback to member table counts
      const realBorrowed = borrowedByMember[member.id] ?? (member.borrowed_count || 0)
      const realOverdue = overdueByMember[member.id] ?? (member.overdue_count || 0)
      
      // Generate membership ID if missing
      let membershipId = member.membership_id
      if (!membershipId || membershipId === 'N/A') {
        // Generate a membership ID based on member ID
        membershipId = `LIB${String(member.id).padStart(6, '0')}`
        // Optionally update in database (async, don't wait)
        supabase
          .from('library_members')
          .update({ membership_id: membershipId })
          .eq('id', member.id)
          .then(() => console.log(`Generated membership ID ${membershipId} for member ${member.id}`))
          .catch(err => console.error(`Failed to update membership ID for member ${member.id}:`, err))
      }
      
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        membershipId: membershipId,
        joinDate: member.join_date || member.created_at,
        borrowedBooks: realBorrowed,
        overdueBooks: realOverdue,
        activeRequests: memberRequests.active,
        readyRequests: memberRequests.ready,
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

