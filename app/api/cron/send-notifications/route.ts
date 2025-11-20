import { NextRequest, NextResponse } from 'next/server'

const CRON_SECRET = process.env.CRON_SECRET || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  return await handleCron(request)
}

export async function POST(request: NextRequest) {
  return await handleCron(request)
}

async function handleCron(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret') || 
                      request.nextUrl.searchParams.get('secret') ||
                      authHeader?.replace('Bearer ', '')

    if (CRON_SECRET && cronSecret !== CRON_SECRET) {
      console.error('Unauthorized cron request - invalid secret')
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Vercel Cron sends a specific header, but we'll also accept secret-based auth
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
    
    if (!isVercelCron && CRON_SECRET && !cronSecret) {
      console.warn('Cron request without proper authentication')
      // Allow in development if no secret is set
      if (CRON_SECRET) {
        return NextResponse.json({ 
          error: 'Unauthorized - missing authentication' 
        }, { status: 401 })
      }
    }

    console.log('Starting scheduled notification job...')
    const startTime = Date.now()

    // Call both notification services
    const [dueRemindersResult, userNotificationsResult] = await Promise.allSettled([
      fetch(`${APP_URL}/api/notifications/send-due-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      fetch(`${APP_URL}/api/notifications/send-user-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ])

    // Process due reminders result
    let dueRemindersData: any = { sent: 0, failed: 0, message: 'Not executed' }
    if (dueRemindersResult.status === 'fulfilled') {
      try {
        dueRemindersData = await dueRemindersResult.value.json()
      } catch (error) {
        console.error('Error parsing due reminders response:', error)
        dueRemindersData = { error: 'Failed to parse response' }
      }
    } else {
      console.error('Due reminders request failed:', dueRemindersResult.reason)
      dueRemindersData = { error: dueRemindersResult.reason?.message || 'Request failed' }
    }

    // Process user notifications result
    let userNotificationsData: any = { sent: 0, failed: 0, message: 'Not executed' }
    if (userNotificationsResult.status === 'fulfilled') {
      try {
        userNotificationsData = await userNotificationsResult.value.json()
      } catch (error) {
        console.error('Error parsing user notifications response:', error)
        userNotificationsData = { error: 'Failed to parse response' }
      }
    } else {
      console.error('User notifications request failed:', userNotificationsResult.reason)
      userNotificationsData = { error: userNotificationsResult.reason?.message || 'Request failed' }
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    const totalSent = (dueRemindersData.sent || 0) + (userNotificationsData.sent || 0)
    const totalFailed = (dueRemindersData.failed || 0) + (userNotificationsData.failed || 0)

    console.log(`Scheduled notification job completed in ${duration}ms`)
    console.log(`Total: ${totalSent} sent, ${totalFailed} failed`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      dueBookReminders: {
        sent: dueRemindersData.sent || 0,
        failed: dueRemindersData.failed || 0,
        message: dueRemindersData.message || 'Completed',
        error: dueRemindersData.error
      },
      userNotifications: {
        sent: userNotificationsData.sent || 0,
        failed: userNotificationsData.failed || 0,
        message: userNotificationsData.message || 'Completed',
        error: userNotificationsData.error
      },
      summary: {
        totalSent,
        totalFailed,
        totalProcessed: totalSent + totalFailed
      }
    })

  } catch (error: any) {
    console.error('Error in cron send-notifications:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

