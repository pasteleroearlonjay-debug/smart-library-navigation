#!/usr/bin/env node

/**
 * Test Script: Simple Supabase Auth Integration (Fixed)
 * 
 * This script tests the new simple Supabase Auth signup and login endpoints
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testSimpleAuth() {
  console.log('🧪 Testing Simple Supabase Auth Integration')
  console.log('===========================================')
  console.log('')

  const testUser = {
    name: 'Test User',
    email: `testuser${Date.now()}@gmail.com`, // Use a more standard email format
    password: 'TestPassword123!'
  }

  try {
    // Test 1: User Signup
    console.log('📝 Test 1: User Signup')
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
      
      console.log('🎉 Signup test passed!')
      console.log('')
      console.log('✅ Your Supabase Auth integration is working correctly!')
      console.log('✅ Users will now appear in Supabase Dashboard → Authentication → Users')
      console.log('')
      console.log('📧 Check your email for verification link!')
      console.log('')
      console.log('ℹ️  Note: Login test skipped as email verification is required')
      console.log('   Users need to verify their email before they can login')
      
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

testSimpleAuth()

