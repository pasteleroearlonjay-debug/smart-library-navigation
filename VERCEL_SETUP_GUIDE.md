# Vercel Setup Guide - Production URL & Cron Monitoring

## 1. Update Production URL in Vercel

### Step-by-Step Instructions:

1. **Find Your Vercel App URL:**
   - Go to: https://vercel.com/dashboard
   - Click on your project: `smart-library-navigation`
   - Look at the latest deployment URL (e.g., `https://smart-library-navigation.vercel.app`)
   - Or go to **Settings** → **Domains** to see your domain

2. **Update Environment Variable:**
   - In Vercel Dashboard, go to your project
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar
   - Find `NEXT_PUBLIC_APP_URL` in the list
   - Click on it to edit
   - Change the value from `http://localhost:3000` to your actual Vercel URL:
     ```
     https://smart-library-navigation.vercel.app
     ```
     (Replace with your actual URL)
   - Make sure **Environment** is set to **Production** (or **All Environments**)
   - Click **Save**

3. **Redeploy:**
   - After updating, go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger auto-deployment

### Quick Check:
After deployment, verify the URL is correct:
- Visit: `https://your-app.vercel.app/test-email`
- The page should load (not redirect to localhost)

---

## 2. Monitor Daily Cron Job

### Method 1: Vercel Dashboard (Easiest)

1. **View Cron Jobs:**
   - Go to: https://vercel.com/dashboard
   - Click your project
   - Go to **Settings** → **Cron Jobs**
   - You should see: `0 9 * * *` → `/api/cron/send-notifications`
   - This means it runs daily at 9:00 AM UTC

2. **Check Execution Logs:**
   - Go to **Deployments** tab
   - Click on any deployment
   - Click **Functions** tab
   - Find `/api/cron/send-notifications`
   - Click on it to view logs
   - Look for execution times around 9:00 AM UTC

3. **View Function Logs:**
   - In the function details, click **Logs** tab
   - You'll see:
     - When the cron job ran
     - How many emails were sent
     - Any errors that occurred
     - Response summary

### Method 2: Check Function Invocations

1. **Go to Functions:**
   - Vercel Dashboard → Your Project → **Functions** tab
   - Find `/api/cron/send-notifications`
   - Click on it

2. **View Invocations:**
   - You'll see a list of all invocations
   - Check the timestamp (should be around 9:00 AM UTC daily)
   - Click on an invocation to see:
     - Request details
     - Response
     - Execution time
     - Logs

### Method 3: Check Email Delivery

1. **Check Your Email:**
   - After 9:00 AM UTC, check your inbox
   - Look for emails sent by the system
   - Check spam folder too

2. **Check Database:**
   - Go to Supabase Dashboard
   - Open `email_notifications` table
   - Filter by `sent_time` to see recent emails
   - Check `status` column (should be 'sent' for successful emails)

### Method 4: Manual Trigger (For Testing)

You can manually trigger the cron job to test it:

**Using PowerShell:**
```powershell
$CRON_SECRET = "01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5"
$headers = @{
    "x-cron-secret" = $CRON_SECRET
}

Invoke-RestMethod -Uri "https://your-app.vercel.app/api/cron/send-notifications" `
  -Method GET `
  -Headers $headers
```

**Or with query parameter:**
```powershell
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/cron/send-notifications?secret=$CRON_SECRET" `
  -Method GET
```

---

## 3. Troubleshooting Cron Jobs

### Cron Job Not Running?

1. **Check Cron Configuration:**
   - Verify `vercel.json` has cron configuration:
     ```json
     "crons": [
       {
         "path": "/api/cron/send-notifications",
         "schedule": "0 9 * * *"
       }
     ]
     ```

2. **Check Environment Variables:**
   - Ensure `CRON_SECRET` is set in Vercel
   - Ensure `NEXT_PUBLIC_APP_URL` is set correctly

3. **Check Function Exists:**
   - Verify `/api/cron/send-notifications/route.ts` exists
   - Check that it's deployed

4. **Check Vercel Plan:**
   - Cron jobs require Vercel Pro plan (or higher)
   - Free plan doesn't support cron jobs
   - Check your plan: Settings → Plan

### Cron Job Running But No Emails?

1. **Check Function Logs:**
   - Look for errors in Vercel function logs
   - Check if emails are being sent but failing

2. **Check Email Configuration:**
   - Verify Gmail SMTP credentials are correct
   - Check `SMTP_PASS` is the App Password (not regular password)

3. **Check Database:**
   - Verify `borrowing_records` has books due soon
   - Verify `user_notifications` has unread notifications
   - Check `email_notifications` table for failed sends

---

## 4. Time Zone Conversion

The cron job runs at **9:00 AM UTC** daily.

**Convert to your timezone:**
- UTC to EST (US Eastern): UTC - 5 hours = 4:00 AM EST
- UTC to PST (US Pacific): UTC - 8 hours = 1:00 AM PST
- UTC to PHT (Philippines): UTC + 8 hours = 5:00 PM PHT

**To change the schedule:**
Edit `vercel.json`:
```json
"crons": [
  {
    "path": "/api/cron/send-notifications",
    "schedule": "0 9 * * *"  // Change this (cron format)
  }
]
```

**Cron Format:** `minute hour day month weekday`
- `0 9 * * *` = 9:00 AM UTC daily
- `0 17 * * *` = 5:00 PM UTC daily (5:00 PM UTC = 1:00 AM PHT next day)

---

## 5. Quick Reference

### Important URLs:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Cron Jobs:** Settings → Cron Jobs
- **Environment Variables:** Settings → Environment Variables
- **Function Logs:** Deployments → Functions → Logs

### Important Variables:
- `NEXT_PUBLIC_APP_URL` = Your Vercel production URL
- `CRON_SECRET` = Secret token for cron authentication
- `SMTP_PASS` = Gmail App Password (16 characters)

### Test Commands:
```powershell
# Test due reminders
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/notifications/send-due-reminders" -Method POST

# Test user notifications
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/notifications/send-user-notifications" -Method POST

# Test cron endpoint
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/cron/send-notifications?secret=YOUR_SECRET" -Method GET
```

