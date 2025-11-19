#!/usr/bin/env node

/**
 * Email Test Script for Smart Library System
 * 
 * This script tests the email functionality without needing the web interface.
 * Run with: node test-email.js
 */

const fetch = require('node-fetch')

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'your-email@example.com'

async function testEmail() {
  console.log('🧪 Testing Email System...')
  console.log(`📧 API URL: ${API_URL}`)
  console.log(`📧 Test Email: ${TEST_EMAIL}`)
  console.log('')

  try {
    // Test 1: Basic email
    console.log('📤 Test 1: Sending basic test email...')
    const response1 = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: '🧪 Smart Library Email Test',
        message: `Hello!

This is a test email from your Smart Library System.

If you received this email, your email system is working correctly! 🎉

Best regards,
Smart Library System`,
        type: 'test'
      })
    })

    const result1 = await response1.json()
    
    if (response1.ok) {
      console.log('✅ Test 1 PASSED: Basic email sent successfully')
    } else {
      console.log('❌ Test 1 FAILED:', result1.error)
    }

    console.log('')

    // Test 2: Book due reminder
    console.log('📤 Test 2: Sending book due reminder...')
    const response2 = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: '📚 Book Due Reminder - Mathematics Fundamentals',
        message: `Dear Student,

Your book "Mathematics Fundamentals" is due in 2 days (January 25, 2024).

Please return it to the library or renew it online through your account.

Due Date: January 25, 2024
Location: Main Library

Thank you for using our Smart Library System!

Best regards,
Library Staff`,
        type: 'due_reminder'
      })
    })

    const result2 = await response2.json()
    
    if (response2.ok) {
      console.log('✅ Test 2 PASSED: Book due reminder sent successfully')
    } else {
      console.log('❌ Test 2 FAILED:', result2.error)
    }

    console.log('')

    // Test 3: Book ready notification
    console.log('📤 Test 3: Sending book ready notification...')
    const response3 = await fetch(`${API_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: '📖 Book Ready for Pickup - Advanced Physics',
        message: `Dear Student,

Great news! Your requested book "Advanced Physics" is now ready for pickup!

📚 Book Details:
- Title: Advanced Physics
- Author: Dr. John Smith
- Location: Main Library, Desk 3

🕒 Pickup Instructions:
- Please visit the library during operating hours
- Bring your student ID
- The book will be held for 7 days

Library Hours:
- Monday-Friday: 8:00 AM - 8:00 PM
- Saturday: 9:00 AM - 5:00 PM
- Sunday: 1:00 PM - 6:00 PM

Thank you for using our Smart Library System!

Best regards,
Library Staff`,
        type: 'book_ready'
      })
    })

    const result3 = await response3.json()
    
    if (response3.ok) {
      console.log('✅ Test 3 PASSED: Book ready notification sent successfully')
    } else {
      console.log('❌ Test 3 FAILED:', result3.error)
    }

    console.log('')

    // Summary
    console.log('📊 Test Summary:')
    console.log(`✅ Passed: ${[result1, result2, result3].filter(r => r && !r.error).length}/3`)
    console.log(`❌ Failed: ${[result1, result2, result3].filter(r => r && r.error).length}/3`)
    
    if (TEST_EMAIL && TEST_EMAIL !== 'your-email@example.com') {
      console.log('')
      console.log(`📧 Check your email inbox (${TEST_EMAIL}) for the test emails!`)
    } else {
      console.log('')
      console.log('⚠️  To receive actual emails, set the TEST_EMAIL environment variable:')
      console.log('   export TEST_EMAIL=your-email@example.com')
      console.log('   node test-email.js')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Make sure your development server is running (npm run dev)')
    console.log('2. Check your email service configuration in .env.local')
    console.log('3. Verify your API keys are correct')
    console.log('4. Check the server logs for detailed error messages')
  }
}

// Run the test
testEmail()

