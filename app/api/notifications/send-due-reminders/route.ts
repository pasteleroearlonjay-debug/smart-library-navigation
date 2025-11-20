import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Query borrowing_records for all borrowed books
    const { data: borrowedBooks, error: queryError } = await supabase
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
      .order('due_date', { ascending: true })

    if (queryError) {
      console.error('Error querying borrowing_records:', queryError)
      return NextResponse.json({ 
        error: 'Failed to query borrowing records',
        details: queryError.message 
      }, { status: 500 })
    }

    if (!borrowedBooks || borrowedBooks.length === 0) {
      return NextResponse.json({ 
        message: 'No books due for reminders',
        sent: 0,
        failed: 0
      })
    }

    // Filter to overdue items or those due within the next 24 hours
    const hourMs = 1000 * 60 * 60
    const dueBooks = borrowedBooks.filter(record => {
      if (!record.due_date) return false
      const dueDate = new Date(record.due_date)
      const diffHours = Math.ceil((dueDate.getTime() - now.getTime()) / hourMs)
      const isOverdue = dueDate.getTime() < now.getTime()
      const isDueWithinDay = diffHours <= 24 && diffHours >= 0
      return isOverdue || isDueWithinDay
    })

    if (dueBooks.length === 0) {
      return NextResponse.json({ 
        message: 'No books due within the next 24 hours',
        sent: 0,
        failed: 0
      })
    }

    let sentCount = 0
    let failedCount = 0
    const results: Array<{ recordId: number; email: string; status: string; error?: string }> = []

    // Process each due book
    for (const record of dueBooks) {
      try {
        const member = record.library_members
        if (!member || !member.email) {
          console.warn(`Skipping record ${record.id}: No member email found`)
          failedCount++
          results.push({
            recordId: record.id,
            email: member?.email || 'unknown',
            status: 'failed',
            error: 'No member email found'
          })
          continue
        }

        // Check if we've already sent a reminder today
        const lastReminderSent = record.last_reminder_sent
        if (lastReminderSent) {
          const lastReminderDate = new Date(lastReminderSent)
          lastReminderDate.setHours(0, 0, 0, 0)
          
          // Skip if we already sent a reminder today
          if (lastReminderDate.getTime() === today.getTime()) {
            console.log(`Skipping record ${record.id}: Already sent reminder today`)
            continue
          }
        }

        const dueDate = new Date(record.due_date)
        const diffMs = dueDate.getTime() - now.getTime()
        const hoursUntilDue = Math.ceil(diffMs / hourMs)
        const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (record.last_reminder_sent) {
          const lastReminderDate = new Date(record.last_reminder_sent)
          lastReminderDate.setHours(0, 0, 0, 0)
          if (lastReminderDate.toISOString().split('T')[0] === todayStr) {
            console.log(`Skipping record ${record.id}: Already reminded today`)
            continue
          }
        }
        
        // Determine email subject and message based on due status
        let subject: string
        let message: string
        let notificationType: 'deadline_reminder' | 'overdue_notice'
        
        let notificationMessage = ''

        if (diffMs < 0) {
          // Overdue
          const daysOverdue = Math.abs(daysUntilDue)
          const hoursOverdue = Math.abs(hoursUntilDue)
          subject = `Overdue Book Reminder: "${record.book_title || 'Your Book'}"`
          message = `Dear ${member.name},\n\n` +
            `This is a reminder that your book "${record.book_title || 'Unknown Book'}" ` +
            `is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} (${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''}) overdue.\n\n` +
            `Due Date: ${dueDate.toLocaleDateString()}\n` +
            `Borrowed Date: ${new Date(record.borrowed_date).toLocaleDateString()}\n\n` +
            `Please return this book to the library as soon as possible to avoid any penalties.\n\n` +
            `Thank you for your cooperation.\n\n` +
            `Smart Library System`
          notificationType = 'overdue_notice'
          notificationMessage = `Your book "${record.book_title || 'Unknown Book'}" is overdue by ${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''}. Please return it immediately to avoid penalties.`
        } else {
          // Due within 24 hours
          const hoursText = Math.max(hoursUntilDue, 0)
          subject = `Due in 24 Hours: "${record.book_title || 'Your Book'}"`
          message = `Dear ${member.name},\n\n` +
            `This is a friendly reminder that your book "${record.book_title || 'Unknown Book'}" ` +
            `is due in ${hoursText} hour${hoursText !== 1 ? 's' : ''}.\n\n` +
            `Due Date: ${dueDate.toLocaleDateString()}\n` +
            `Borrowed Date: ${new Date(record.borrowed_date).toLocaleDateString()}\n\n` +
            `Please return or renew this book before the due date to avoid any late fees.\n\n` +
            `Thank you!\n\n` +
            `Smart Library System`
          notificationType = 'deadline_reminder'
          notificationMessage = `Your book "${record.book_title || 'Unknown Book'}" is due in ${hoursText} hour${hoursText !== 1 ? 's' : ''} on ${dueDate.toLocaleDateString()}.`
        }

        // Create in-app notification before emailing (best effort)
        let notificationId: number | null = null
        try {
          const { data: notificationRow, error: notificationError } = await supabase
            .from('user_notifications')
            .insert({
              member_id: member.id,
              type: notificationType,
              title: notificationType === 'overdue_notice' ? 'Book Overdue' : 'Book Due in 24 Hours',
              message: notificationMessage,
              related_borrowing_record_id: record.id,
              is_read: false
            })
            .select('id')
            .single()

          if (notificationError) {
            console.error(`Failed to create user notification for record ${record.id}:`, notificationError)
          } else {
            notificationId = notificationRow?.id ?? null
          }
        } catch (notificationException) {
          console.error(`Error inserting notification for record ${record.id}:`, notificationException)
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
            message: message,
            type: notificationType,
            userId: member.id,
            bookId: record.book_id || null
          })
        })

        if (emailResponse.ok) {
          // Update last_reminder_sent date
          const { error: updateError } = await supabase
            .from('borrowing_records')
            .update({ 
              last_reminder_sent: todayStr
            })
            .eq('id', record.id)

          if (updateError) {
            console.error(`Error updating last_reminder_sent for record ${record.id}:`, updateError)
          }

          if (notificationId) {
            await supabase
              .from('user_notifications')
              .update({ emailed_at: new Date().toISOString() })
              .eq('id', notificationId)
          }

          sentCount++
          results.push({
            recordId: record.id,
            email: member.email,
            status: 'sent'
          })
        } else {
          const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }))
          failedCount++
          results.push({
            recordId: record.id,
            email: member.email,
            status: 'failed',
            error: errorData.error || 'Email sending failed'
          })
        }
      } catch (error: any) {
        console.error(`Error processing record ${record.id}:`, error)
        failedCount++
        results.push({
          recordId: record.id,
          email: record.library_members?.email || 'unknown',
          status: 'failed',
          error: error?.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Due book reminders processed: ${sentCount} sent, ${failedCount} failed`,
      sent: sentCount,
      failed: failedCount,
      total: dueBooks.length,
      results: results
    })

  } catch (error: any) {
    console.error('Error in send-due-reminders API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

