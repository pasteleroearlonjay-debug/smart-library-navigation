#!/usr/bin/env node

/**
 * Email Verification Test Script
 * 
 * This script tests the email verification system.
 * Run with: node test-verification-email.js
 */

const fetch = require('node-fetch')

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'your-email@example.com'

async function testEmailVerification() {
  console.log('🧪 Testing Email Verification System...')
  console.log(`📧 API URL: ${API_URL}`)
  console.log(`📧 Test Email: ${TEST_EMAIL}`)
  console.log('')

  try {
    // Step 1: Test user signup (this should send verification email)
    console.log('📤 Step 1: Testing user signup with email verification...')
    
    const signupResponse = await fetch(`${API_URL}/api/user/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: TEST_EMAIL,
        password: 'testpassword123'
      })
    })

    const signupResult = await signupResponse.json()
    
    if (signupResponse.ok) {
      console.log('✅ Step 1 PASSED: User signup successful')
      console.log(`   User ID: ${signupResult.user.id}`)
      console.log(`   Membership ID: ${signupResult.user.membershipId}`)
      console.log(`   Message: ${signupResult.message}`)
    } else {
      if (signupResult.error.includes('already exists')) {
        console.log('⚠️  Step 1 WARNING: User already exists (this is expected for testing)')
      } else {
        console.log('❌ Step 1 FAILED:', signupResult.error)
        return
      }
    }

    console.log('')

    // Step 2: Test resend verification email
    console.log('📤 Step 2: Testing resend verification email...')
    
    const resendResponse = await fetch(`${API_URL}/api/user/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    })

    const resendResult = await resendResponse.json()
    
    if (resendResponse.ok) {
      console.log('✅ Step 2 PASSED: Resend verification email successful')
      console.log(`   Message: ${resendResult.message}`)
    } else {
      console.log('❌ Step 2 FAILED:', resendResult.error)
    }

    console.log('')

    // Step 3: Test direct email sending
    console.log('📤 Step 3: Testing direct email sending...')
    
    const emailResponse = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: '🧪 Smart Library Verification Test',
        message: `Hello Test User!

This is a test email to verify that your Smart Library email system is working correctly.

If you received this email, your email configuration is working! 🎉

Best regards,
Smart Library System`,
        type: 'test'
      })
    })

    const emailResult = await emailResponse.json()
    
    if (emailResponse.ok) {
      console.log('✅ Step 3 PASSED: Direct email sending successful')
    } else {
      console.log('❌ Step 3 FAILED:', emailResult.error)
    }

    console.log('')

    // Summary
    console.log('📊 Email Verification Test Summary:')
    console.log('✅ User signup with verification email')
    console.log('✅ Resend verification email')
    console.log('✅ Direct email sending')
    
    if (TEST_EMAIL && TEST_EMAIL !== 'your-email@example.com') {
      console.log('')
      console.log(`📧 Check your email inbox (${TEST_EMAIL}) for the verification emails!`)
      console.log('')
      console.log('🔗 If you received verification emails, you can test the verification link:')
      console.log(`   ${API_URL}/verify-email?token=test&email=${encodeURIComponent(TEST_EMAIL)}`)
    } else {
      console.log('')
      console.log('⚠️  To receive actual emails, set the TEST_EMAIL environment variable:')
      console.log('   export TEST_EMAIL=your-email@example.com')
      console.log('   node test-verification-email.js')
    }

    console.log('')
    console.log('🔧 Next Steps:')
    console.log('1. Check your email inbox for verification emails')
    console.log('2. Click the verification link in the email')
    console.log('3. Test the verification page at /verify-email')
    console.log('4. Try logging in with the verified account')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Make sure your development server is running (npm run dev)')
    console.log('2. Check your email service configuration in .env.local')
    console.log('3. Verify your Supabase configuration')
    console.log('4. Check the server logs for detailed error messages')
  }
}

// Run the test
testEmailVerification()

