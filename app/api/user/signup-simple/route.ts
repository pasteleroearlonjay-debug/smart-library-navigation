import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppUrl } from '@/lib/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Basic email validation (Supabase will do more thorough validation)
    if (!email.includes('@') || !email.includes('.')) {
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

    // Use Supabase Auth to sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          full_name: name
        },
        emailRedirectTo: `${getAppUrl()}/auth/callback`
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
