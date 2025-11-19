import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppUrl } from '@/lib/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Use service role key for admin operations (resending emails)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
// Use anon key for regular operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
// Create regular client for other operations
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

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
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase not configured. Please check environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      )
    }

    // First, check if user exists and get their status
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

    // Generate a new verification token and send email
    try {
      // Use admin API to generate a new verification link
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: `${getAppUrl()}/auth/callback`
        }
      })

      if (linkError) {
        console.error('Generate link error:', linkError)
        return NextResponse.json(
          { error: 'Failed to generate verification link: ' + linkError.message },
          { status: 500 }
        )
      }

      // Send the verification email using our email service
      const emailResponse = await fetch(`${getAppUrl()}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: '📧 Verify Your Smart Library Account (Resend)',
          message: `Hello!

You requested a new verification email for your Smart Library account.

To complete your account setup, please verify your email address by clicking the link below:

${linkData.properties?.action_link || 'Verification link not available'}

This link will expire in 24 hours for security reasons.

If you didn't request this email, please ignore it.

Best regards,
Smart Library System Team

---
This is an automated message. Please do not reply to this email.`,
          type: 'email_verification_resend',
          userId: user.id
        })
      })

      if (emailResponse.ok) {
        return NextResponse.json({
          success: true,
          message: 'New verification email sent successfully! Please check your inbox.'
        })
      } else {
        console.error('Email sending failed:', await emailResponse.text())
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again later.' },
          { status: 500 }
        )
      }

    } catch (error) {
      console.error('Resend verification error:', error)
      return NextResponse.json(
        { error: 'Failed to resend verification email. Please try again later.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

