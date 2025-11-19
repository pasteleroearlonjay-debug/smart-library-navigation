import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const adminUser = request.headers.get('x-admin-user')
    
    if (!adminToken || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch email notifications
    const { data: emailNotifications, error: emailError } = await supabase
      .from('email_notifications')
      .select(`
        *,
        library_members!email_notifications_user_id_fkey(
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (emailError) {
      console.error('Error fetching email notifications:', emailError)
    }

    // Fetch user notifications
    const { data: userNotifications, error: userError } = await supabase
      .from('user_notifications')
      .select(`
        *,
        library_members!user_notifications_member_id_fkey(
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (userError) {
      console.error('Error fetching user notifications:', userError)
    }

    // Fetch borrowing records for due date analysis
    const { data: borrowingRecords, error: borrowingError } = await supabase
      .from('borrowing_records')
      .select(`
        *,
        library_members!borrowing_records_member_id_fkey(
          name,
          email
        )
      `)
      .eq('status', 'borrowed')
      .order('due_date', { ascending: true })

    if (borrowingError) {
      console.error('Error fetching borrowing records:', borrowingError)
    }

    // Calculate statistics
    const stats = {
      totalEmailNotifications: emailNotifications?.length || 0,
      pendingEmailNotifications: emailNotifications?.filter(n => n.status === 'pending').length || 0,
      sentEmailNotifications: emailNotifications?.filter(n => n.status === 'sent').length || 0,
      totalUserNotifications: userNotifications?.length || 0,
      unreadUserNotifications: userNotifications?.filter(n => !n.is_read).length || 0,
      overdueItems: borrowingRecords?.filter(br => new Date(br.due_date) < new Date()).length || 0,
      dueSoonItems: borrowingRecords?.filter(br => {
        const dueDate = new Date(br.due_date)
        const today = new Date()
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
        return diffDays <= 3 && diffDays > 0
      }).length || 0
    }

    // Transform email notifications for display
    const emailNotificationsList = emailNotifications?.map(notification => {
      const daysUntilDue = notification.user_id ? 
        Math.ceil((new Date(notification.scheduled_time || '').getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0

      return {
        id: notification.id,
        type: notification.notification_type,
        user: notification.library_members?.name || 'Unknown',
        email: notification.email_address,
        book: notification.book_id ? `Book ID: ${notification.book_id}` : 'General',
        dueDate: notification.scheduled_time ? new Date(notification.scheduled_time).toISOString().split('T')[0] : '',
        daysUntilDue,
        status: notification.status,
        scheduledTime: notification.scheduled_time,
        sentTime: notification.sent_time,
        message: notification.message
      }
    }) || []

    // Transform user notifications for display
    const userNotificationsList = userNotifications?.map(notification => ({
      id: notification.id,
      type: notification.type,
      user: notification.library_members?.name || 'Unknown',
      email: notification.library_members?.email || '',
      title: notification.title,
      message: notification.message,
      isRead: notification.is_read,
      createdAt: notification.created_at,
      readAt: notification.read_at
    })) || []

    // Transform borrowing records for due date analysis
    const dueDateAnalysis = borrowingRecords?.map(record => {
      const dueDate = new Date(record.due_date)
      const today = new Date()
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
      
      return {
        id: record.id,
        user: record.library_members?.name || 'Unknown',
        email: record.library_members?.email || '',
        book: record.book_title || `Book ID: ${record.book_id}`,
        dueDate: record.due_date,
        daysUntilDue: diffDays,
        status: diffDays < 0 ? 'overdue' : diffDays <= 3 ? 'due_soon' : 'normal',
        borrowedDate: record.borrowed_date
      }
    }) || []

    return NextResponse.json({
      emailNotifications: emailNotificationsList,
      userNotifications: userNotificationsList,
      dueDateAnalysis,
      stats
    })
  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const adminUser = request.headers.get('x-admin-user')
    
    if (!adminToken || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationIds } = body

    if (action === 'send_pending') {
      // Get pending notifications
      const { data: pendingNotifications, error: fetchError } = await supabase
        .from('email_notifications')
        .select(`
          *,
          library_members!email_notifications_user_id_fkey(
            name,
            email
          )
        `)
        .eq('status', 'pending')
        .in('id', notificationIds || [])

      if (fetchError) {
        console.error('Error fetching pending notifications:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
      }

      let sentCount = 0
      let failedCount = 0

      // Send each notification
      for (const notification of pendingNotifications || []) {
        try {
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: notification.email_address,
              subject: notification.subject || 'Library Notification',
              message: notification.message,
              type: notification.notification_type,
              userId: notification.user_id,
              bookId: notification.book_id
            })
          })

          if (emailResponse.ok) {
            // Update notification status to sent
            await supabase
              .from('email_notifications')
              .update({ 
                status: 'sent',
                sent_time: new Date().toISOString()
              })
              .eq('id', notification.id)
            sentCount++
          } else {
            // Update notification status to failed
            await supabase
              .from('email_notifications')
              .update({ 
                status: 'failed'
              })
              .eq('id', notification.id)
            failedCount++
          }
        } catch (error) {
          console.error('Error sending notification:', error)
          // Update notification status to failed
          await supabase
            .from('email_notifications')
            .update({ 
              status: 'failed'
            })
            .eq('id', notification.id)
          failedCount++
        }
      }

      return NextResponse.json({ 
        message: `Notifications processed: ${sentCount} sent, ${failedCount} failed`,
        sent: sentCount,
        failed: failedCount
      })
    }

    if (action === 'create_reminders') {
      // Create automatic reminders for due dates
      const { data: dueSoonBooks } = await supabase
        .from('borrowing_records')
        .select(`
          *,
          library_members!borrowing_records_member_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('status', 'borrowed')
        .lte('due_date', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gt('due_date', new Date().toISOString().split('T')[0])

      if (dueSoonBooks) {
        const notifications = dueSoonBooks.map(record => ({
          member_id: record.library_members?.id,
          type: 'deadline_reminder',
          title: 'Book Due Soon',
          message: `Your book "${record.book_title}" is due on ${new Date(record.due_date).toLocaleDateString()}. Please return or renew it soon.`,
          related_borrowing_record_id: record.id,
          is_read: false
        })).filter(n => n.member_id)

        if (notifications.length > 0) {
          await supabase
            .from('user_notifications')
            .insert(notifications)
        }
      }

      return NextResponse.json({ message: 'Reminders created successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in notifications POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
