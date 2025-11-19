#!/usr/bin/env node

/**
 * Test Script: Check Login Errors
 * 
 * This script tests the login functionality to identify any errors
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testLoginError() {
  console.log('🔍 Testing Login Errors')
  console.log('======================')
  console.log('')

  // Test with a verified user (you can replace with your actual email)
  const testCredentials = {
    email: 'testuser1759392548575@gmail.com', // Use the email from the previous signup
    password: 'TestPassword123!'
  }

  try {
    console.log('🔑 Testing Login')
    console.log(`   Email: ${testCredentials.email}`)
    
    const loginResponse = await fetch(`${SUPABASE_URL}/api/user/login-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials)
    })

    const loginResult = await loginResponse.json()
    
    console.log(`   Status: ${loginResponse.status}`)
    console.log(`   Response:`, JSON.stringify(loginResult, null, 2))
    
    if (loginResponse.ok) {
      console.log('   ✅ Login successful!')
      console.log(`   User ID: ${loginResult.user.id}`)
      console.log(`   Name: ${loginResult.user.name}`)
      console.log(`   Email Verified: ${loginResult.user.emailVerified}`)
    } else {
      console.log('   ❌ Login failed:')
      console.log(`   Error: ${loginResult.error}`)
      
      if (loginResult.error.includes('Email not confirmed')) {
        console.log('')
        console.log('💡 Solution: Verify your email first!')
        console.log('   1. Check your email inbox')
        console.log('   2. Click the verification link')
        console.log('   3. Then try logging in again')
      }
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

testLoginError()

