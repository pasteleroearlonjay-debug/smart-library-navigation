import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const adminUser = request.headers.get('x-admin-user')
    
    if (!adminToken || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'user' // 'user' or 'email'

    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    let result
    let error

    if (type === 'user') {
      // Delete user notification
      const { data, error: deleteError } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId)

      result = data
      error = deleteError
    } else if (type === 'email') {
      // Delete email notification
      const { data, error: deleteError } = await supabase
        .from('email_notifications')
        .delete()
        .eq('id', notificationId)

      result = data
      error = deleteError
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    if (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ 
        error: 'Failed to delete notification',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
      deletedId: notificationId
    })

  } catch (error: any) {
    console.error('Error in delete notification API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

