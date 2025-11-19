# 📧 Email Setup Guide for Smart Library System

## 🚀 Quick Setup (Recommended)

### Option 1: Resend (Easiest Setup)

1. **Sign up for Resend** (Free tier available):
   - Go to [resend.com](https://resend.com)
   - Create an account
   - Get your API key from the dashboard

2. **Configure Environment Variables**:
   ```bash
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=library@yourschool.com
   FROM_NAME=Smart Library System
   ```

3. **Verify your domain** (optional but recommended):
   - Add your domain in Resend dashboard
   - Update `FROM_EMAIL` to use your verified domain

### Option 2: SendGrid

1. **Sign up for SendGrid**:
   - Go to [sendgrid.com](https://sendgrid.com)
   - Create an account (free tier: 100 emails/day)
   - Create an API key

2. **Configure Environment Variables**:
   ```bash
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.your_api_key_here
   FROM_EMAIL=library@yourschool.com
   FROM_NAME=Smart Library System
   ```

### Option 3: Gmail SMTP (Free)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

3. **Configure Environment Variables**:
   ```bash
   EMAIL_SERVICE=nodemailer
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   FROM_EMAIL=your_email@gmail.com
   FROM_NAME=Smart Library System
   ```

## 🔧 Environment Setup

1. **Copy the example environment file**:
   ```bash
   cp env.example .env.local
   ```

2. **Edit `.env.local`** with your email service credentials:
   ```bash
   # Choose one of the options above and configure accordingly
   EMAIL_SERVICE=resend  # or sendgrid or nodemailer
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## 📋 Email Types Supported

The system sends these types of emails:

### 📚 **Book Due Reminders**
- Sent 3 days before due date
- Sent 1 day before due date
- Overdue notifications

### 📖 **Book Ready Notifications**
- When requested books are ready for pickup
- Includes pickup instructions

### 👋 **Welcome Emails**
- New user registration confirmations
- Account setup instructions

### 🔔 **General Notifications**
- System announcements
- Account updates
- Password resets

## 🧪 Testing Email Functionality

### Method 1: Admin Dashboard
1. Go to **Admin Dashboard** → **Notifications**
2. Click **"Send Pending"** button
3. Check the console for email logs (in development mode)

### Method 2: Direct API Test
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email from Smart Library System",
    "type": "test"
  }'
```

### Method 3: Create Test Notifications
1. Add some sample data to `email_notifications` table
2. Use the admin dashboard to send them

## 🎨 Email Templates

The system uses beautiful HTML email templates with:
- ✅ **Responsive design** (works on mobile)
- ✅ **Professional styling** with gradients
- ✅ **Smart Library branding**
- ✅ **Clear call-to-actions**
- ✅ **Footer with contact info**

## 🔍 Troubleshooting

### Common Issues:

#### 1. **"Email service not configured"**
- ✅ Check your `.env.local` file
- ✅ Ensure environment variables are set correctly
- ✅ Restart your development server

#### 2. **"Failed to send email"**
- ✅ Verify your API key is correct
- ✅ Check email service limits
- ✅ Ensure sender email is verified

#### 3. **Emails going to spam**
- ✅ Use a verified domain (recommended)
- ✅ Add SPF/DKIM records
- ✅ Use proper sender name

#### 4. **Rate limiting errors**
- ✅ Check your email service limits
- ✅ Implement delays between sends
- ✅ Use batch sending

## 📊 Email Analytics

The system tracks:
- ✅ **Sent emails** count
- ✅ **Failed emails** with error reasons
- ✅ **Email types** and recipients
- ✅ **Delivery timestamps**

View analytics in: **Admin Dashboard** → **Notifications**

## 🚀 Production Deployment

### For Vercel:
1. Add environment variables in Vercel dashboard
2. Set `NEXT_PUBLIC_APP_URL` to your production URL
3. Deploy and test

### For other platforms:
1. Set environment variables in your hosting platform
2. Update `NEXT_PUBLIC_APP_URL`
3. Test email functionality

## 📞 Support

If you need help:
1. Check the console logs for error messages
2. Verify your email service configuration
3. Test with a simple email first
4. Check your email service dashboard for delivery reports

## 🎉 Success!

Once configured, your Smart Library System will automatically send:
- 📧 **Due date reminders**
- 📧 **Book ready notifications**
- 📧 **Welcome emails**
- 📧 **System notifications**

All emails are logged in the database and can be tracked through the admin dashboard!

