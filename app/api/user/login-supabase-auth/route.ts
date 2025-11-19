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

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured. Please check environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Use Supabase Auth to sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Please verify your email address before logging in' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Login failed: ' + authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      )
    }

    // Get additional user data from library_members table
    let memberData = null
    try {
      const { data: member, error: memberError } = await supabase
        .from('library_members')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (memberError) {
        console.error('Library member fetch error:', memberError)
      } else {
        memberData = member
      }
    } catch (memberError) {
      console.error('Library member table error:', memberError)
    }

    // Create session token (in production, use the session from Supabase)
    const token = authData.session?.access_token || Buffer.from(`${authData.user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: authData.user.id,
        name: authData.user.user_metadata?.name || memberData?.name || 'User',
        email: authData.user.email,
        membershipId: memberData?.membership_id || null,
        emailVerified: authData.user.email_confirmed_at ? true : false,
        lastLogin: authData.user.last_sign_in_at
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

