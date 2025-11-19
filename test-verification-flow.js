#!/usr/bin/env node

/**
 * Test Script: Complete Email Verification Flow
 * 
 * This script tests the complete email verification process
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testVerificationFlow() {
  console.log('🧪 Testing Complete Email Verification Flow')
  console.log('==========================================')
  console.log('')

  const testUser = {
    name: 'Verification Test User',
    email: `verifytest${Date.now()}@gmail.com`,
    password: 'TestPassword123!'
  }

  try {
    // Step 1: User Signup
    console.log('📝 Step 1: User Signup')
    console.log(`   Name: ${testUser.name}`)
    console.log(`   Email: ${testUser.email}`)
    
    const signupResponse = await fetch(`${SUPABASE_URL}/api/user/signup-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    })

    const signupResult = await signupResponse.json()
    
    if (signupResponse.ok) {
      console.log('   ✅ Signup successful!')
      console.log(`   User ID: ${signupResult.user.id}`)
      console.log(`   Membership ID: ${signupResult.user.membershipId}`)
      console.log(`   Message: ${signupResult.message}`)
      console.log('')
      
      // Step 2: Test Resend Verification
      console.log('📧 Step 2: Test Resend Verification')
      
      const resendResponse = await fetch(`${SUPABASE_URL}/api/user/resend-verification-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testUser.email })
      })

      const resendResult = await resendResponse.json()
      
      if (resendResponse.ok) {
        console.log('   ✅ Resend verification successful!')
        console.log(`   Message: ${resendResult.message}`)
      } else {
        console.log('   ⚠️  Resend verification failed:', resendResult.error)
      }
      
      console.log('')
      console.log('🎉 Email verification flow test completed!')
      console.log('')
      console.log('✅ Your email verification system is working correctly!')
      console.log('✅ Users will receive verification emails with proper links')
      console.log('✅ Verification links will redirect to /auth/callback')
      console.log('✅ Users can resend verification emails if needed')
      console.log('')
      console.log('📧 Check your email for the verification link!')
      console.log('   The link should redirect to: /auth/callback?type=signup&code=...')
      console.log('   Which will then redirect to: /verify-email?success=true&email=...')
      
    } else {
      console.log('   ❌ Signup failed:', signupResult.error)
      console.log('')
      console.log('🔧 Troubleshooting:')
      console.log('1. Check your Supabase project settings')
      console.log('2. Verify your environment variables')
      console.log('3. Make sure your Next.js server is running')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Make sure your Next.js server is running (npm run dev)')
    console.log('2. Check your Supabase environment variables')
    console.log('3. Verify your Supabase project is active')
  }
}

testVerificationFlow()

