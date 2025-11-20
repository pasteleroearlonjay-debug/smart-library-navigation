import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    // Query user_notifications for unread notifications that haven't been emailed yet
    // Check if emailed_at is null (not yet emailed)
    const { data: unreadNotifications, error: queryError } = await supabase
      .from('user_notifications')
      .select(`
        *,
        library_members!user_notifications_member_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('is_read', false)
      .is('emailed_at', null)
      .order('created_at', { ascending: true })

    if (queryError) {
      console.error('Error querying user_notifications:', queryError)
      return NextResponse.json({ 
        error: 'Failed to query user notifications',
        details: queryError.message 
      }, { status: 500 })
    }

    if (!unreadNotifications || unreadNotifications.length === 0) {
      return NextResponse.json({ 
        message: 'No unread notifications to email',
        sent: 0,
        failed: 0
      })
    }

    let sentCount = 0
    let failedCount = 0
    const results: Array<{ notificationId: number; email: string; status: string; error?: string }> = []

    // Process each notification
    for (const notification of unreadNotifications) {
      try {
        const member = notification.library_members
        if (!member || !member.email) {
          console.warn(`Skipping notification ${notification.id}: No member email found`)
          failedCount++
          results.push({
            notificationId: notification.id,
            email: member?.email || 'unknown',
            status: 'failed',
            error: 'No member email found'
          })
          continue
        }

        // Determine email subject based on notification type
        let subject: string
        let emailMessage: string

        switch (notification.type) {
          case 'book_ready':
            subject = notification.title || 'Book Ready for Collection'
            emailMessage = `Dear ${member.name},\n\n` +
              `${notification.message}\n\n` +
              `Please visit the library to collect your book.\n\n` +
              `Thank you!\n\n` +
              `Smart Library System`
            break

          case 'deadline_reminder':
            subject = notification.title || 'Book Due Soon'
            emailMessage = `Dear ${member.name},\n\n` +
              `${notification.message}\n\n` +
              `Please return or renew your book before the due date.\n\n` +
              `Thank you!\n\n` +
              `Smart Library System`
            break

          case 'overdue_notice':
            subject = notification.title || 'Overdue Book Notice'
            emailMessage = `Dear ${member.name},\n\n` +
              `${notification.message}\n\n` +
              `Please return this book to the library as soon as possible to avoid any penalties.\n\n` +
              `Thank you for your cooperation.\n\n` +
              `Smart Library System`
            break

          case 'welcome':
            subject = notification.title || 'Welcome to Smart Library System'
            emailMessage = `Dear ${member.name},\n\n` +
              `${notification.message}\n\n` +
              `We're excited to have you as a member!\n\n` +
              `Smart Library System`
            break

          case 'email_verification':
            subject = notification.title || 'Email Verification'
            emailMessage = `Dear ${member.name},\n\n` +
              `${notification.message}\n\n` +
              `Smart Library System`
            break

          default:
            subject = notification.title || 'Library Notification'
            emailMessage = `Dear ${member.name},\n\n` +
              `${notification.message}\n\n` +
              `Smart Library System`
        }

        // Send email via email API
        const emailResponse = await fetch(`${APP_URL}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: member.email,
            subject: subject,
            message: emailMessage,
            type: notification.type,
            userId: member.id,
            bookId: notification.related_book_id || null
          })
        })

        if (emailResponse.ok) {
          // Update emailed_at timestamp
          const { error: updateError } = await supabase
            .from('user_notifications')
            .update({ 
              emailed_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          if (updateError) {
            console.error(`Error updating emailed_at for notification ${notification.id}:`, updateError)
          }

          sentCount++
          results.push({
            notificationId: notification.id,
            email: member.email,
            status: 'sent'
          })
        } else {
          const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }))
          failedCount++
          results.push({
            notificationId: notification.id,
            email: member.email,
            status: 'failed',
            error: errorData.error || 'Email sending failed'
          })
        }
      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error)
        failedCount++
        results.push({
          notificationId: notification.id,
          email: notification.library_members?.email || 'unknown',
          status: 'failed',
          error: error?.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `User notifications processed: ${sentCount} sent, ${failedCount} failed`,
      sent: sentCount,
      failed: failedCount,
      total: unreadNotifications.length,
      results: results
    })

  } catch (error: any) {
    console.error('Error in send-user-notifications API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

