import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function getUserIdFromToken(token: string): Promise<string | number | null> {
  try {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [userId] = decoded.split(':')
      if (userId) {
        return userId
      }
    } catch (e) {
      // ignore decode errors
    }

    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token)

    if (user && !error) {
      return user.id
    }

    return null
  } catch (error) {
    console.error('Error decoding notification token:', error)
    return null
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      )
    }

    const notificationId = params.id

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromToken(token)

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token or user not found' },
        { status: 401 }
      )
    }

    const normalizedUserId =
      typeof userId === 'string' && !isNaN(Number(userId)) ? Number(userId) : userId

    const { data: updatedNotification, error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('member_id', normalizedUserId)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to update notification:', error)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    if (!updatedNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      notification: updatedNotification
    })

  } catch (error) {
    console.error('Update notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
