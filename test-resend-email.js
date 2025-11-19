#!/usr/bin/env node

/**
 * Test Script: Resend Verification Email
 * 
 * This script tests the resend verification email functionality
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testResendEmail() {
  console.log('🧪 Testing Resend Verification Email')
  console.log('===================================')
  console.log('')

  // Test with a real email address (replace with your email for testing)
  const testEmail = 'test@example.com' // Change this to a real email for testing

  try {
    console.log('📧 Testing Resend Verification Email')
    console.log(`   Email: ${testEmail}`)
    
    const resendResponse = await fetch(`${SUPABASE_URL}/api/user/resend-verification-fixed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    })

    const resendResult = await resendResponse.json()
    
    if (resendResponse.ok) {
      console.log('   ✅ Resend verification successful!')
      console.log(`   Message: ${resendResult.message}`)
      console.log('')
      console.log('🎉 Resend email functionality is working!')
      
    } else {
      console.log('   ❌ Resend verification failed:', resendResult.error)
      console.log('')
      console.log('ℹ️  This might be expected if:')
      console.log('   • No account exists with this email')
      console.log('   • Email is already verified')
      console.log('   • Email service is not configured')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Make sure your Next.js server is running (npm run dev)')
    console.log('2. Check your Supabase environment variables')
    console.log('3. Verify your email service configuration')
  }
}

testResendEmail()

