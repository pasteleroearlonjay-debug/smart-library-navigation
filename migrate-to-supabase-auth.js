#!/usr/bin/env node

/**
 * Migration Script: Move users from library_members to Supabase Auth
 * 
 * This script will help you migrate existing users to Supabase Authentication
 * so they appear in the Authentication tab in your Supabase dashboard.
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lcqurcfhkzcbwbppezed.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjcXVyY2Zoa3pjYndicHBlemVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NzM5MDcsImV4cCI6MjA3MTM0OTkwN30.yVQWhVoZKyc9MlmJX5mNqWHpBQTZ29Y8RTCl__JQ14s'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function migrateUsers() {
  console.log('🔄 Starting user migration to Supabase Auth...')
  console.log(`📧 Supabase URL: ${SUPABASE_URL}`)
  console.log('')

  try {
    // Step 1: Get all users from library_members table
    console.log('📋 Step 1: Fetching existing users from library_members table...')
    
    const { data: existingUsers, error: fetchError } = await supabase
      .from('library_members')
      .select('*')

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
      return
    }

    console.log(`✅ Found ${existingUsers.length} users in library_members table`)
    console.log('')

    if (existingUsers.length === 0) {
      console.log('ℹ️  No users found to migrate. You can start fresh!')
      return
    }

    // Step 2: Create users in Supabase Auth
    console.log('👥 Step 2: Creating users in Supabase Auth...')
    
    let successCount = 0
    let errorCount = 0

    for (const user of existingUsers) {
      try {
        console.log(`   Creating auth user for: ${user.email}`)
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'TempPassword123!', // Temporary password - users should reset
          email_confirm: user.email_verified || false,
          user_metadata: {
            name: user.name,
            full_name: user.name,
            membership_id: user.membership_id
          }
        })

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`   ⚠️  User ${user.email} already exists in Auth`)
          } else {
            console.log(`   ❌ Error creating ${user.email}:`, authError.message)
            errorCount++
          }
        } else {
          console.log(`   ✅ Created auth user: ${user.email}`)
          
          // Update library_members record with auth user ID
          const { error: updateError } = await supabase
            .from('library_members')
            .update({ 
              id: authData.user.id, // Use auth user ID
              email_verified: authData.user.email_confirmed_at ? true : false
            })
            .eq('email', user.email)

          if (updateError) {
            console.log(`   ⚠️  Warning: Could not update library_members for ${user.email}`)
          }
          
          successCount++
        }
      } catch (error) {
        console.log(`   ❌ Error processing ${user.email}:`, error.message)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${successCount} users`)
    console.log(`❌ Failed migrations: ${errorCount} users`)
    console.log(`📋 Total users processed: ${existingUsers.length}`)

    if (successCount > 0) {
      console.log('')
      console.log('🎉 Migration completed! Your users should now appear in:')
      console.log('   Supabase Dashboard → Authentication → Users')
      console.log('')
      console.log('⚠️  Important Notes:')
      console.log('   • All users have temporary password: TempPassword123!')
      console.log('   • Users should reset their passwords on first login')
      console.log('   • Update your signup/login APIs to use Supabase Auth')
    }

  } catch (error) {
    console.error('❌ Migration failed with error:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Check your Supabase credentials')
    console.log('2. Verify your database connection')
    console.log('3. Check the server logs for detailed errors')
  }
}

// Helper function to check if we have admin access
async function checkAdminAccess() {
  try {
    console.log('🔍 Checking Supabase connection and admin access...')
    
    // Try to list users (requires admin access)
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Admin access check failed:', error.message)
      console.log('')
      console.log('🔧 To fix this:')
      console.log('1. Make sure you have the correct Supabase URL and API key')
      console.log('2. For admin operations, you may need the service role key')
      console.log('3. Check your Supabase project settings')
      return false
    }
    
    console.log('✅ Admin access confirmed!')
    console.log(`📊 Found ${data.users.length} existing auth users`)
    console.log('')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

// Run the migration
async function main() {
  console.log('🚀 Smart Library System - User Migration Tool')
  console.log('=============================================')
  console.log('')
  
  const hasAccess = await checkAdminAccess()
  if (hasAccess) {
    await migrateUsers()
  }
}

main()

