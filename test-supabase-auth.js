#!/usr/bin/env node

/**
 * Test Script: Supabase Auth Integration
 * 
 * This script tests the new Supabase Auth signup and login endpoints
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testSupabaseAuth() {
  console.log('🧪 Testing Supabase Auth Integration')
  console.log('===================================')
  console.log('')

  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!'
  }

  try {
    // Test 1: User Signup
    console.log('📝 Test 1: User Signup')
    console.log(`   Email: ${testUser.email}`)
    
    const signupResponse = await fetch(`${SUPABASE_URL}/api/user/signup-supabase-auth`, {
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
      console.log('')
      
      // Test 2: User Login
      console.log('🔑 Test 2: User Login')
      
      const loginResponse = await fetch(`${SUPABASE_URL}/api/user/login-supabase-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      })

      const loginResult = await loginResponse.json()
      
      if (loginResponse.ok) {
        console.log('   ✅ Login successful!')
        console.log(`   User ID: ${loginResult.user.id}`)
        console.log(`   Name: ${loginResult.user.name}`)
        console.log(`   Email Verified: ${loginResult.user.emailVerified}`)
        console.log('')
        
        console.log('🎉 All tests passed!')
        console.log('')
        console.log('✅ Your Supabase Auth integration is working correctly!')
        console.log('✅ Users will now appear in Supabase Dashboard → Authentication → Users')
        
      } else {
        console.log('   ❌ Login failed:', loginResult.error)
      }
      
    } else {
      console.log('   ❌ Signup failed:', signupResult.error)
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

testSupabaseAuth()

