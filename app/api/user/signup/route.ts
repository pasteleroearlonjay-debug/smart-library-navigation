import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

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

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('library_members')
      .select('id')
      .eq('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Generate membership ID
    const membershipId = `LIB${String(Date.now()).slice(-6)}`

    // Create email verification token
    const verificationToken = uuidv4()

    // Insert new user (with unverified email)
    const { data: newUser, error } = await supabase
      .from('library_members')
      .insert({
        name,
        email,
        password_hash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Default hash for demo
        join_date: new Date().toISOString().split('T')[0],
        membership_id: membershipId,
        email_verified: false,
        email_verification_token: verificationToken,
        borrowed_count: 0,
        overdue_count: 0,
        status: 'Active'
      })
      .select('id, name, email, membership_id')
      .single()

    if (error) {
      console.error('User creation error:', error)
      
      // Check if it's a missing table error
      if (error.message.includes('relation "library_members" does not exist')) {
        return NextResponse.json(
          { error: 'Database not set up yet. Please run the SQL setup first.' },
          { status: 500 }
        )
      }
      
      // Check if it's a missing column error
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database schema outdated. Please run the enhancement SQL.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Store verification token in email_verifications table (if it exists)
    try {
      await supabase
        .from('email_verifications')
        .insert({
          member_id: newUser.id,
          token: verificationToken,
          email: email,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
    } catch (verificationError) {
      console.log('Email verifications table not found, skipping verification token storage')
    }

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
      
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: '📧 Verify Your Smart Library Account',
          message: `Hello ${name}!

Welcome to the Smart Library System! 🎉

To complete your account setup, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't create this account, please ignore this email.

Best regards,
Smart Library System Team

---
This is an automated message. Please do not reply to this email.`,
          type: 'email_verification',
          userId: newUser.id
        })
      })

      if (emailResponse.ok) {
        console.log(`Verification email sent to ${email}`)
      } else {
        console.error('Failed to send verification email:', await emailResponse.text())
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Don't fail the signup if email fails
    }

    // Create welcome notification (if table exists)
    try {
      await supabase
        .from('user_notifications')
        .insert({
          member_id: newUser.id,
          type: 'welcome',
          title: 'Welcome to Smart Library!',
          message: `Welcome ${name}! Your account has been created successfully. Please check your email to verify your account.`,
          is_read: false
        })
    } catch (notificationError) {
      console.log('User notifications table not found, skipping welcome notification')
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email for verification.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        membershipId: newUser.membership_id
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