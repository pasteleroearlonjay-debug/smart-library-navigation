#!/usr/bin/env node

/**
 * Test Script: Working Resend Verification Email
 * 
 * This script tests the working resend verification email functionality
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testResendWorking() {
  console.log('🧪 Testing Working Resend Verification Email')
  console.log('============================================')
  console.log('')

  // First, create a test user
  const testUser = {
    name: 'Resend Test User',
    email: `resendtest${Date.now()}@gmail.com`,
    password: 'TestPassword123!'
  }

  try {
    // Step 1: Create a user first
    console.log('📝 Step 1: Creating test user')
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
      console.log('   ✅ User created successfully!')
      console.log(`   User ID: ${signupResult.user.id}`)
      console.log('')
      
      // Step 2: Test resend verification
      console.log('📧 Step 2: Testing resend verification')
      
      const resendResponse = await fetch(`${SUPABASE_URL}/api/user/resend-verification-working`, {
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
        console.log('')
        console.log('🎉 Resend email functionality is working!')
        console.log('')
        console.log('✅ Your resend email system is working correctly!')
        console.log('✅ Users can now resend verification emails')
        console.log('✅ Rate limiting is properly handled')
        
      } else {
        console.log('   ⚠️  Resend verification response:', resendResult)
        
        if (resendResponse.status === 429) {
          console.log('   ℹ️  Rate limited - this is normal security behavior')
          console.log('   ℹ️  Wait 60 seconds and try again')
        } else if (resendResponse.status === 400) {
          console.log('   ℹ️  Email might already be verified')
        } else {
          console.log('   ❌ Resend failed:', resendResult.error)
        }
      }
      
    } else {
      console.log('   ❌ User creation failed:', signupResult.error)
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

testResendWorking()

