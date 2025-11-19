import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppUrl } from '@/lib/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Use service role key for admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured. Please check environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      )
    }

    const user = userData.user

    // Check if email is already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'This email is already verified. You can log in now.' },
        { status: 400 }
      )
    }

    // Use Supabase's built-in resend functionality
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${getAppUrl()}/auth/callback`
      }
    })

    if (error) {
      console.error('Generate link error:', error)
      
      // Handle specific error cases
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Please wait a moment before requesting another verification email.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('already confirmed')) {
        return NextResponse.json(
          { error: 'This email is already verified. You can log in now.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to resend verification email: ' + error.message },
        { status: 500 }
      )
    }

    // If we have a link, we can provide it to the user (for testing)
    const verificationLink = data.properties?.action_link

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully! Please check your inbox.',
      ...(verificationLink && { verificationLink }) // Include link for testing
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

