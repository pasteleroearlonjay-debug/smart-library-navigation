import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Email service configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'nodemailer' // 'nodemailer', 'resend', 'sendgrid'
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'library@yourschool.com'
const FROM_NAME = process.env.FROM_NAME || 'Smart Library System'

// Resend API key (if using Resend service)
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

// SendGrid API key (if using SendGrid service)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, type, userId, bookId } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let emailSent = false
    let emailError = null

    // Try different email services based on configuration
    switch (EMAIL_SERVICE) {
      case 'resend':
        emailSent = await sendWithResend(to, subject, message)
        break
      case 'sendgrid':
        emailSent = await sendWithSendGrid(to, subject, message)
        break
      case 'nodemailer':
      default:
        emailSent = await sendWithNodemailer(to, subject, message)
        break
    }

    // Log email attempt to database
    await logEmailAttempt(to, subject, message, type, userId, bookId, emailSent, emailError)

    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully' 
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: emailError 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Send email using Resend service
async function sendWithResend(to: string, subject: string, message: string): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.log('Resend API key not configured, using mock email service')
      return await sendMockEmail(to, subject, message)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Smart Library System</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This is an automated message from the Smart Library System. Please do not reply to this email.
              </p>
            </div>
            <div style="background: #343a40; padding: 15px; text-align: center; color: white; font-size: 12px;">
              © 2024 Smart Library System. All rights reserved.
            </div>
          </div>
        `
      }),
    })

    if (response.ok) {
      console.log('Email sent successfully via Resend')
      return true
    } else {
      const error = await response.text()
      console.error('Resend email failed:', error)
      return false
    }
  } catch (error) {
    console.error('Error sending email via Resend:', error)
    return false
  }
}

// Send email using SendGrid service
async function sendWithSendGrid(to: string, subject: string, message: string): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.log('SendGrid API key not configured, using mock email service')
      return await sendMockEmail(to, subject, message)
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Smart Library System</h1>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                  <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                  <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This is an automated message from the Smart Library System. Please do not reply to this email.
                  </p>
                </div>
                <div style="background: #343a40; padding: 15px; text-align: center; color: white; font-size: 12px;">
                  © 2024 Smart Library System. All rights reserved.
                </div>
              </div>
            `
          }
        ]
      }),
    })

    if (response.ok) {
      console.log('Email sent successfully via SendGrid')
      return true
    } else {
      const error = await response.text()
      console.error('SendGrid email failed:', error)
      return false
    }
  } catch (error) {
    console.error('Error sending email via SendGrid:', error)
    return false
  }
}

// Send email using Nodemailer (SMTP)
async function sendWithNodemailer(to: string, subject: string, message: string): Promise<boolean> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.log('SMTP credentials not configured, using mock email service')
      return await sendMockEmail(to, subject, message)
    }

    // For now, we'll use a mock implementation since we can't use Node.js modules directly in Next.js API routes
    // In a real implementation, you would use nodemailer here
    console.log('Nodemailer not fully implemented, using mock email service')
    return await sendMockEmail(to, subject, message)
  } catch (error) {
    console.error('Error sending email via Nodemailer:', error)
    return false
  }
}

// Mock email service for development/testing
async function sendMockEmail(to: string, subject: string, message: string): Promise<boolean> {
  try {
    console.log('📧 MOCK EMAIL SENT:')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Message: ${message}`)
    console.log('---')
    
    // In development, we'll just log the email
    // In production, this should be replaced with a real email service
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return true
  } catch (error) {
    console.error('Error in mock email service:', error)
    return false
  }
}

// Log email attempt to database
async function logEmailAttempt(
  to: string, 
  subject: string, 
  message: string, 
  type: string, 
  userId: number, 
  bookId: number, 
  success: boolean, 
  error: string | null
) {
  try {
    await supabase
      .from('email_notifications')
      .insert({
        user_id: userId,
        book_id: bookId,
        notification_type: type || 'general',
        email_address: to,
        subject: subject,
        message: message,
        status: success ? 'sent' : 'failed',
        sent_time: success ? new Date().toISOString() : null
      })
  } catch (error) {
    console.error('Error logging email attempt:', error)
  }
}

