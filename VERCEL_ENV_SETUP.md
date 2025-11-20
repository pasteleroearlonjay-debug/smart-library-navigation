# Vercel Environment Variables Setup Guide

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/dashboard
Select your project: `smart-library-navigation`

### 2. Navigate to Environment Variables
- Click on your project
- Go to **Settings** tab
- Click **Environment Variables** in the left sidebar

### 3. Add These Variables One by One

Click **Add New** for each variable below:

#### Variable 1: EMAIL_SERVICE
- **Key**: `EMAIL_SERVICE`
- **Value**: `nodemailer`
- **Environment**: Select all (Production, Preview, Development)
- Click **Save**

#### Variable 2: SMTP_HOST
- **Key**: `SMTP_HOST`
- **Value**: `smtp.gmail.com`
- **Environment**: Select all
- Click **Save**

#### Variable 3: SMTP_PORT
- **Key**: `SMTP_PORT`
- **Value**: `587`
- **Environment**: Select all
- Click **Save**

#### Variable 4: SMTP_USER
- **Key**: `SMTP_USER`
- **Value**: `pasteleroearlonjay@gmail.com`
- **Environment**: Select all
- Click **Save**

#### Variable 5: SMTP_PASS
- **Key**: `SMTP_PASS`
- **Value**: `[YOUR_16_CHARACTER_APP_PASSWORD_HERE]`
  - ⚠️ **IMPORTANT**: Use the App Password from Step 1, NOT your regular password
  - It should be 16 characters with no spaces
- **Environment**: Select all
- Click **Save**

#### Variable 6: FROM_EMAIL
- **Key**: `FROM_EMAIL`
- **Value**: `pasteleroearlonjay@gmail.com`
- **Environment**: Select all
- Click **Save**

#### Variable 7: FROM_NAME
- **Key**: `FROM_NAME`
- **Value**: `Smart Library System`
- **Environment**: Select all
- Click **Save**

#### Variable 8: CRON_SECRET
- **Key**: `CRON_SECRET`
- **Value**: `01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5`
- **Environment**: Select all
- Click **Save**

#### Variable 9: NEXT_PUBLIC_APP_URL
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://smart-library-navigation.vercel.app`
  - ⚠️ Replace with your actual Vercel deployment URL if different
- **Environment**: Select all
- Click **Save**

### 4. Verify All Variables Are Added

You should see 9 environment variables listed:
1. EMAIL_SERVICE
2. SMTP_HOST
3. SMTP_PORT
4. SMTP_USER
5. SMTP_PASS
6. FROM_EMAIL
7. FROM_NAME
8. CRON_SECRET
9. NEXT_PUBLIC_APP_URL

### 5. Redeploy Your Application

After adding all variables:
- Go to **Deployments** tab
- Click the **⋯** (three dots) on the latest deployment
- Click **Redeploy**
- Or push a new commit to trigger auto-deployment

## Security Notes

⚠️ **NEVER use your regular Gmail password!**
- Gmail requires App Passwords for SMTP access
- App Passwords are 16 characters and can be revoked individually
- Your regular password won't work and is insecure to use

## Testing

After deployment, test the email system:
1. Go to: `https://your-app.vercel.app/test-email`
2. Enter a test email address
3. Click "Send Test Email"
4. Check if email is received

## Troubleshooting

If emails don't send:
1. Verify App Password is correct (16 characters, no spaces)
2. Check 2-Step Verification is enabled
3. Verify all environment variables are set correctly
4. Check Vercel function logs for errors

