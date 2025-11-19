import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors
  if (error || error_description) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}/verify-email?error=${encodeURIComponent(error_description || error || 'Authentication failed')}`)
  }

  // Handle email confirmation
  if (type === 'signup' && code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Code exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/verify-email?error=${encodeURIComponent('Failed to verify email. Please try again.')}`)
      }

      if (data.user && data.user.email_confirmed_at) {
        // Update library_members table to mark email as verified
        const { error: updateError } = await supabase
          .from('library_members')
          .update({ email_verified: true })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Library member update error:', updateError)
        }

        // Redirect to success page
        return NextResponse.redirect(`${requestUrl.origin}/verify-email?success=true&email=${encodeURIComponent(data.user.email || '')}`)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/verify-email?error=${encodeURIComponent('Email verification failed. Please try again.')}`)
      }
    } catch (error) {
      console.error('Verification error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/verify-email?error=${encodeURIComponent('Verification failed. Please try again.')}`)
    }
  }

  // Handle password recovery
  if (type === 'recovery' && code) {
    return NextResponse.redirect(`${requestUrl.origin}/reset-password?code=${code}`)
  }

  // Default redirect
  return NextResponse.redirect(`${requestUrl.origin}/`)
}

