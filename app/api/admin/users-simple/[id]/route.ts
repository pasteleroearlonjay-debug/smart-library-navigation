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
    // Basic admin authentication check
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('library_members')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user from library_members table
    const { error: deleteError } = await supabase
      .from('library_members')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Also try to delete from borrowing_records if they exist
    // Note: This might fail if there are foreign key constraints, but we'll try
    try {
      await supabase
        .from('borrowing_records')
        .delete()
        .eq('member_id', userId)
    } catch (borrowingError) {
      console.log('Note: Could not delete borrowing records (might not exist or have constraints)')
    }

    // Try to delete from user_notifications if they exist
    try {
      await supabase
        .from('user_notifications')
        .delete()
        .eq('member_id', userId)
    } catch (notificationError) {
      console.log('Note: Could not delete user notifications (might not exist)')
    }

    // Try to delete from book_requests if they exist
    try {
      await supabase
        .from('book_requests')
        .delete()
        .eq('member_id', userId)
    } catch (requestError) {
      console.log('Note: Could not delete book requests (might not exist)')
    }

    return NextResponse.json({
      success: true,
      message: `User "${existingUser.name}" has been deleted successfully`,
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      }
    })

  } catch (error) {
    console.error('Error in delete user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

