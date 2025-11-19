import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    console.log(`Attempting to resend verification email to: ${email}`)

    // Use Supabase Auth's built-in resend functionality
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      console.error('Resend error:', error)
      
      // Handle specific error cases with user-friendly messages
      if (error.message.includes('rate limit') || error.message.includes('For security purposes')) {
        return NextResponse.json(
          { error: 'Please wait a moment before requesting another verification email.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('already confirmed') || error.message.includes('already verified')) {
        return NextResponse.json(
          { error: 'This email is already verified. You can log in now.' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('not found') || error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'No account found with this email address.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to resend verification email: ' + error.message },
        { status: 500 }
      )
    }

    console.log('Verification email sent successfully')

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully! Please check your inbox.'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

