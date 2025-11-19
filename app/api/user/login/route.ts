import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Query user from database
    const { data: user, error } = await supabase
      .from('library_members')
      .select('id, name, email, membership_id, profile_picture_url, email_verified, borrowed_count, overdue_count, status, last_login, password_hash')
      .eq('email', email)
      .eq('status', 'Active')
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in. Check your inbox for a verification link.' },
        { status: 401 }
      )
    }

    // Simple password check (replace with bcrypt in production)
    // For this demo, the default password is 'password123'
    const isValidPassword = password === 'password123' // TEMPORARY - Use bcrypt in production!

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await supabase
      .from('library_members')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Create session token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        membershipId: user.membership_id,
        profilePictureUrl: user.profile_picture_url,
        emailVerified: user.email_verified,
        borrowedCount: user.borrowed_count,
        overdueCount: user.overdue_count,
        status: user.status
      }
    })

  } catch (error) {
    console.error('User login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

