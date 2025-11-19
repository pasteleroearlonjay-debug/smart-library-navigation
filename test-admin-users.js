#!/usr/bin/env node

/**
 * Test Script: Admin Users API
 * 
 * This script tests the admin users API to see if it works
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'

async function testAdminUsers() {
  console.log('🧪 Testing Admin Users API')
  console.log('==========================')
  console.log('')

  try {
    console.log('📋 Testing GET /api/admin/users-simple')
    
    // Test without authentication first to see the error
    const response = await fetch(`${SUPABASE_URL}/api/admin/users-simple`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(result, null, 2))
    
    if (response.status === 401) {
      console.log('   ✅ API is working! (Unauthorized is expected without admin token)')
    } else if (response.ok) {
      console.log('   ✅ API is working!')
      console.log(`   Found ${result.users?.length || 0} users`)
    } else {
      console.log('   ❌ API error:', result.error)
      if (result.details) {
        console.log('   Details:', result.details)
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

testAdminUsers()

