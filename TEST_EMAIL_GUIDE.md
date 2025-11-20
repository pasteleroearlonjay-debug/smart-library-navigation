# Email Notification System - Testing Guide

## Method 1: Web Interface (Easiest)

### Local Testing:
1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000/test-email`

3. Enter your email and click "Send Test Email"

### Production Testing:
1. Visit: `https://your-app.vercel.app/test-email`
2. Enter your email and click "Send Test Email"

---

## Method 2: Test Email API Directly

### Using cURL (Windows PowerShell):
```powershell
# Basic test email
curl -X POST http://localhost:3000/api/email/send `
  -H "Content-Type: application/json" `
  -d '{\"to\": \"pasteleroearlonjay@gmail.com\", \"subject\": \"Test Email\", \"message\": \"This is a test email from Smart Library System\", \"type\": \"test\"}'
```

### Using PowerShell Invoke-RestMethod:
```powershell
$body = @{
    to = "pasteleroearlonjay@gmail.com"
    subject = "Test Email from Smart Library"
    message = "This is a test email to verify the system is working."
    type = "test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/email/send" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### For Production (replace with your Vercel URL):
```powershell
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/email/send" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## Method 3: Test Due Book Reminders

### Test the due book reminders endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/send-due-reminders" `
  -Method POST `
  -ContentType "application/json"
```

**What it does:**
- Finds all books due within 3 days or overdue
- Sends reminder emails to users
- Returns summary of emails sent/failed

---

## Method 4: Test User Notifications

### Test the user notifications endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/send-user-notifications" `
  -Method POST `
  -ContentType "application/json"
```

**What it does:**
- Finds unread notifications that haven't been emailed
- Sends email for each notification
- Returns summary of emails sent/failed

---

## Method 5: Test Cron Endpoint (Manual Trigger)

### Test the scheduled cron job manually:
```powershell
# With secret in header
$headers = @{
    "x-cron-secret" = "01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/cron/send-notifications" `
  -Method GET `
  -Headers $headers
```

**Or with query parameter:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/cron/send-notifications?secret=01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5" `
  -Method GET
```

**What it does:**
- Runs both due book reminders AND user notifications
- Returns combined summary

---

## Method 6: Check Vercel Function Logs

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Go to **Deployments** → Click latest deployment
4. Click **Functions** tab
5. Click on `/api/email/send` function
6. View **Logs** to see email sending activity

---

## Expected Results

### ✅ Success Response:
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

### ❌ Error Response:
```json
{
  "error": "Failed to send email",
  "details": "Error message here"
}
```

---

## Troubleshooting

### If emails don't send:

1. **Check Environment Variables:**
   - Verify `SMTP_PASS` is correct (16 characters, no spaces)
   - Verify `SMTP_USER` matches your Gmail
   - Verify `EMAIL_SERVICE=nodemailer`

2. **Check Gmail App Password:**
   - Ensure 2-Step Verification is enabled
   - Verify App Password is correct
   - Try generating a new App Password

3. **Check Logs:**
   - Check browser console for errors
   - Check Vercel function logs
   - Check server console output

4. **Test Locally First:**
   - Make sure `.env.local` is configured
   - Restart dev server after changing `.env.local`
   - Test with `http://localhost:3000/test-email`

5. **Check Email Spam Folder:**
   - Gmail might send test emails to spam initially
   - Check spam/junk folder

---

## Quick Test Checklist

- [ ] Test basic email sending (`/api/email/send`)
- [ ] Test due book reminders (`/api/notifications/send-due-reminders`)
- [ ] Test user notifications (`/api/notifications/send-user-notifications`)
- [ ] Test cron endpoint (`/api/cron/send-notifications`)
- [ ] Verify emails received in inbox
- [ ] Check Vercel logs for errors
- [ ] Verify database records created (`email_notifications` table)

---

## Sample Test Data

To test with real data, make sure you have:
1. **Books in `borrowing_records`** with:
   - `status = 'borrowed'`
   - `due_date` within 3 days or overdue
   - `member_id` linked to `library_members` with valid email

2. **Notifications in `user_notifications`** with:
   - `is_read = false`
   - `emailed_at = null`
   - `member_id` linked to `library_members` with valid email

