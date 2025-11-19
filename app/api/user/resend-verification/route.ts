import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppUrl } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

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

    // Find the user
    const { data: user, error: userError } = await supabase
      .from('library_members')
      .select('id, name, email, email_verified')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found with this email address' },
        { status: 404 }
      )
    }

    // Check if email is already verified
    if (user.email_verified) {
      return NextResponse.json(
        { error: 'This email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = uuidv4()

    // Update user with new verification token
    const { error: updateError } = await supabase
      .from('library_members')
      .update({
        email_verification_token: verificationToken
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating verification token:', updateError)
      return NextResponse.json(
        { error: 'Failed to generate new verification token' },
        { status: 500 }
      )
    }

    // Store verification token in email_verifications table
    try {
      // Delete old verification records for this user
      await supabase
        .from('email_verifications')
        .delete()
        .eq('member_id', user.id)
        .eq('verified', false)

      // Insert new verification record
      await supabase
        .from('email_verifications')
        .insert({
          member_id: user.id,
          token: verificationToken,
          email: email,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
    } catch (verificationError) {
      console.log('Email verifications table not found, skipping verification token storage')
    }

    // Send verification email
    try {
      const verificationUrl = `${getAppUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`
      
      const emailResponse = await fetch(`${getAppUrl()}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: '📧 Verify Your Smart Library Account (Resent)',
          message: `Hello ${user.name}!

You requested a new verification email for your Smart Library account.

To complete your account setup, please verify your email address by clicking the link below:

${verificationUrl}

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
        console.log(`New verification email sent to ${email}`)
        return NextResponse.json({
          success: true,
          message: 'New verification email sent! Please check your inbox.'
        })
      } else {
        console.error('Failed to send verification email:', await emailResponse.text())
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        )
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
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

