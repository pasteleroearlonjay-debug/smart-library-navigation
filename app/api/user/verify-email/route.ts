import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
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

    // Find the verification record
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('verified', false)
      .single()

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Update user email verification status
    const { error: updateError } = await supabase
      .from('library_members')
      .update({
        email_verified: true,
        email_verification_token: null
      })
      .eq('id', verification.member_id)
      .eq('email', email)

    if (updateError) {
      console.error('Error updating user verification status:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      )
    }

    // Mark verification token as verified
    const { error: markVerifiedError } = await supabase
      .from('email_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', verification.id)

    if (markVerifiedError) {
      console.error('Error marking verification as complete:', markVerifiedError)
      // Don't fail the request since the user is already verified
    }

    // Get user details for response
    const { data: user, error: userError } = await supabase
      .from('library_members')
      .select('id, name, email, membership_id, email_verified')
      .eq('id', verification.member_id)
      .single()

    if (userError) {
      console.error('Error fetching user details:', userError)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
      user: user || {
        id: verification.member_id,
        email: email,
        email_verified: true
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
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

    // Find the verification record
    const { data: verification, error: verificationError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('verified', false)
      .single()

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Update user email verification status
    const { error: updateError } = await supabase
      .from('library_members')
      .update({
        email_verified: true,
        email_verification_token: null
      })
      .eq('id', verification.member_id)
      .eq('email', email)

    if (updateError) {
      console.error('Error updating user verification status:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      )
    }

    // Mark verification token as verified
    const { error: markVerifiedError } = await supabase
      .from('email_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', verification.id)

    if (markVerifiedError) {
      console.error('Error marking verification as complete:', markVerifiedError)
      // Don't fail the request since the user is already verified
    }

    // Get user details for response
    const { data: user, error: userError } = await supabase
      .from('library_members')
      .select('id, name, email, membership_id, email_verified')
      .eq('id', verification.member_id)
      .single()

    if (userError) {
      console.error('Error fetching user details:', userError)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
      user: user || {
        id: verification.member_id,
        email: email,
        email_verified: true
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

