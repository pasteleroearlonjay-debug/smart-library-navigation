# Gmail Email Notifications and Reminders - Implementation Summary

## Overview

This implementation adds automatic Gmail email notifications and reminders for:
1. **Due book reminders** - Daily automatic emails starting 3 days before due date
2. **User notifications** - Email notifications for all in-app notifications (book_ready, welcome, etc.)
3. **Scheduled daily job** - Automatically runs via Vercel Cron

## What Was Implemented

### 1. Gmail SMTP Integration ✅
- **File**: `app/api/email/send/route.ts`
- Implemented proper Gmail SMTP using `nodemailer`
- Replaced mock implementation with real Gmail SMTP connection
- Supports Gmail App Password authentication
- Beautiful HTML email templates

### 2. Due Book Reminders API ✅
- **File**: `app/api/notifications/send-due-reminders/route.ts`
- Queries `borrowing_records` for books due within 3 days or overdue
- Checks `last_reminder_sent` to prevent duplicate daily emails
- Sends personalized email reminders via Gmail
- Updates `last_reminder_sent` after successful send

### 3. User Notifications Email Service ✅
- **File**: `app/api/notifications/send-user-notifications/route.ts`
- Queries `user_notifications` for unread notifications that haven't been emailed
- Sends email for all notification types: book_ready, deadline_reminder, overdue_notice, welcome
- Marks notifications as emailed with `emailed_at` timestamp

### 4. Scheduled Cron Job ✅
- **File**: `app/api/cron/send-notifications/route.ts`
- Combined endpoint that runs both due reminders and user notifications
- Authenticated via `CRON_SECRET` environment variable
- Runs daily at 9:00 AM UTC via Vercel Cron
- Returns detailed summary of emails sent/failed

### 5. Database Migration ✅
- **File**: `database_migrations/add_notification_tracking.sql`
- Adds `last_reminder_sent DATE` to `borrowing_records` table
- Adds `emailed_at TIMESTAMP` to `user_notifications` table
- Ensures `email_notifications` table has all required fields
- Creates indexes for performance
- Safe migration (checks if columns exist before adding)

### 6. Dependencies ✅
- **File**: `package.json`
- Added `nodemailer` package
- Added `@types/nodemailer` for TypeScript support

### 7. Environment Configuration ✅
- **File**: `env.example`
- Updated with Gmail SMTP configuration
- Added `CRON_SECRET` for cron authentication
- Instructions for Gmail App Password setup

### 8. Vercel Cron Configuration ✅
- **File**: `vercel.json`
- Added cron job to run daily at 9:00 AM UTC
- Configured to call `/api/cron/send-notifications` endpoint

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install `nodemailer` and `@types/nodemailer`.

### Step 2: Configure Gmail SMTP

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

3. **Update `.env.local`**:
```env
EMAIL_SERVICE=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=Smart Library System
CRON_SECRET=your_random_secret_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Step 3: Run Database Migration

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `database_migrations/add_notification_tracking.sql`
3. Run the migration script
4. Verify columns were added successfully

### Step 4: Deploy to Vercel

1. Push your changes to your repository
2. Deploy to Vercel (or your hosting platform)
3. Add environment variables in Vercel dashboard:
   - `EMAIL_SERVICE=nodemailer`
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your_email@gmail.com`
   - `SMTP_PASS=your_app_password`
   - `FROM_EMAIL=your_email@gmail.com`
   - `FROM_NAME=Smart Library System`
   - `CRON_SECRET=your_secret_token`
   - `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`

4. Vercel will automatically set up the cron job from `vercel.json`

## Testing

### Test Email Sending Manually

```bash
# Test the email API directly
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email"
  }'
```

### Test Due Book Reminders

```bash
# Manually trigger due book reminders
curl -X POST http://localhost:3000/api/notifications/send-due-reminders \
  -H "Content-Type: application/json"
```

### Test User Notifications

```bash
# Manually trigger user notification emails
curl -X POST http://localhost:3000/api/notifications/send-user-notifications \
  -H "Content-Type: application/json"
```

### Test Cron Endpoint

```bash
# Test cron endpoint (requires CRON_SECRET)
curl -X GET "http://localhost:3000/api/cron/send-notifications?secret=your_secret_token"
```

Or with header:
```bash
curl -X GET http://localhost:3000/api/cron/send-notifications \
  -H "x-cron-secret: your_secret_token"
```

## How It Works

### Daily Cron Job Flow

1. **Vercel Cron** triggers `/api/cron/send-notifications` daily at 9:00 AM UTC
2. **Cron endpoint** calls both:
   - `/api/notifications/send-due-reminders` - Sends due book reminders
   - `/api/notifications/send-user-notifications` - Sends user notification emails
3. **Due reminders**:
   - Queries `borrowing_records` for books due within 3 days or overdue
   - Checks `last_reminder_sent` to prevent duplicate emails
   - Sends personalized email via Gmail
   - Updates `last_reminder_sent` date
4. **User notifications**:
   - Queries `user_notifications` for unread notifications without `emailed_at`
   - Sends email for each notification
   - Updates `emailed_at` timestamp

### Email Types Supported

- **deadline_reminder** - Books due within 3 days
- **overdue_notice** - Books that are overdue
- **book_ready** - Book requests ready for pickup
- **welcome** - Welcome messages for new users
- **email_verification** - Email verification messages

## Features

✅ **Automatic daily reminders** starting 3 days before due date  
✅ **Daily reminders** continue until book is returned  
✅ **Email notifications** for all in-app user notifications  
✅ **Gmail SMTP integration** with proper authentication  
✅ **Duplicate prevention** (tracks last reminder sent date)  
✅ **Error handling** and logging to database  
✅ **Beautiful HTML email templates**  
✅ **Scheduled via Vercel Cron** (runs daily)  

## Troubleshooting

### Emails Not Sending

1. **Check Gmail App Password**:
   - Ensure 2-Step Verification is enabled
   - Verify App Password is correct (16 characters)
   - Make sure you're using App Password, not regular password

2. **Check Environment Variables**:
   - Verify all SMTP variables are set correctly
   - Check `EMAIL_SERVICE=nodemailer` is set

3. **Check Logs**:
   - Check Vercel function logs
   - Look for SMTP connection errors
   - Verify email addresses are valid

### Cron Job Not Running

1. **Check Vercel Cron Configuration**:
   - Verify `vercel.json` has cron configuration
   - Check cron schedule is correct (`0 9 * * *` = 9 AM UTC daily)

2. **Check CRON_SECRET**:
   - Ensure `CRON_SECRET` is set in environment variables
   - Verify cron endpoint authentication

3. **Check Vercel Dashboard**:
   - Go to Vercel Dashboard → Your Project → Cron Jobs
   - Verify cron job is registered
   - Check execution logs

### Database Errors

1. **Run Migration**:
   - Ensure `database_migrations/add_notification_tracking.sql` was run
   - Verify columns exist in database

2. **Check Table Structure**:
   - Verify `borrowing_records` has `last_reminder_sent` column
   - Verify `user_notifications` has `emailed_at` column

## API Endpoints

### POST `/api/email/send`
Send an email via Gmail SMTP.

**Body**:
```json
{
  "to": "user@example.com",
  "subject": "Email Subject",
  "message": "Email message",
  "type": "deadline_reminder",
  "userId": 123,
  "bookId": 456
}
```

### POST `/api/notifications/send-due-reminders`
Send due book reminder emails.

**Response**:
```json
{
  "message": "Due book reminders processed: 5 sent, 0 failed",
  "sent": 5,
  "failed": 0,
  "total": 5,
  "results": [...]
}
```

### POST `/api/notifications/send-user-notifications`
Send user notification emails.

**Response**:
```json
{
  "message": "User notifications processed: 3 sent, 0 failed",
  "sent": 3,
  "failed": 0,
  "total": 3,
  "results": [...]
}
```

### GET/POST `/api/cron/send-notifications`
Scheduled cron endpoint (runs both reminder services).

**Authentication**: Requires `CRON_SECRET` in header or query parameter.

**Response**:
```json
{
  "success": true,
  "timestamp": "2024-01-20T09:00:00.000Z",
  "duration": "1234ms",
  "dueBookReminders": {
    "sent": 5,
    "failed": 0,
    "message": "Due book reminders processed: 5 sent, 0 failed"
  },
  "userNotifications": {
    "sent": 3,
    "failed": 0,
    "message": "User notifications processed: 3 sent, 0 failed"
  },
  "summary": {
    "totalSent": 8,
    "totalFailed": 0,
    "totalProcessed": 8
  }
}
```

## Next Steps

1. ✅ Run database migration
2. ✅ Configure Gmail SMTP credentials
3. ✅ Set environment variables
4. ✅ Deploy to Vercel
5. ✅ Test email sending
6. ✅ Monitor cron job execution
7. ✅ Check email delivery

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify Gmail App Password is correct
3. Ensure database migration was run
4. Check environment variables are set correctly
5. Test email API endpoint manually first

