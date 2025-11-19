import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Use service role key for admin operations (creating users)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
// Use anon key for regular operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)
// Create regular client for other operations
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Use Supabase Auth to create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // We'll handle email confirmation manually
      user_metadata: {
        name: name,
        full_name: name
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Generate membership ID
    const membershipId = `LIB${String(Date.now()).slice(-6)}`

    // Also create a record in library_members table for additional data
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('library_members')
        .insert({
          id: authData.user.id, // Use the same ID as auth user
          name: name,
          email: email,
          join_date: new Date().toISOString().split('T')[0],
          membership_id: membershipId,
          borrowed_count: 0,
          overdue_count: 0,
          status: 'Active',
          email_verified: false // Will be true after email confirmation
        })
        .select('id, name, email, membership_id')
        .single()

      if (memberError) {
        console.error('Library member creation error:', memberError)
        // Don't fail the signup if this fails, auth user is already created
      }
    } catch (memberError) {
      console.error('Library member table error:', memberError)
      // Don't fail the signup if this fails
    }

    // Send email confirmation
    try {
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: password,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email`
        }
      })

      if (emailError) {
        console.error('Email confirmation error:', emailError)
      } else {
        console.log(`Email confirmation sent to ${email}`)
      }
    } catch (emailError) {
      console.error('Email confirmation failed:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email for verification.',
      user: {
        id: authData.user.id,
        name: name,
        email: email,
        membershipId: membershipId,
        emailVerified: false
      }
    })

  } catch (error) {
    console.error('User signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
