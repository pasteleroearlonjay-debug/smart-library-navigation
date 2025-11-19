import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (userId) {
      // Log user activity (optional)
      await supabase
        .from('user_notifications')
        .insert({
          member_id: userId,
          type: 'welcome', // We can add a 'logout' type later
          title: 'User Logout',
          message: 'User logged out successfully',
          is_read: true
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('User logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

