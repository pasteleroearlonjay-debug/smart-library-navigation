# 🚀 Smart Library System - Deployment Guide

This guide will walk you through deploying your Smart Library System with Firebase and Vercel.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/) installed
- [Vercel CLI](https://vercel.com/cli) (optional, for advanced deployment)
- Firebase account
- ESP32 development board

## 🔥 Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `smart-library-system`
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### 1.2 Enable Firestore Database

1. In Firebase Console, go to **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location close to your users
5. Click **"Done"**

### 1.3 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"**
3. Click **"Add app"** → **Web app**
4. Register app with name: `smart-library-web`
5. Copy the config object

### 1.4 Update Configuration Files

1. **Update `firebase-setup.js`:**
   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

2. **Update `backend/config.php`:**
   ```php
   define('FIREBASE_PROJECT_ID', 'your-actual-project-id');
   ```

## 🌐 Step 2: Initialize Firebase Database

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Run Firebase Setup Script
```bash
npm run setup-firebase
```

### 2.3 Verify Data in Firebase Console
- Go to Firestore Database
- Check that collections are created:
  - `books` (18 sample books)
  - `led_states` (6 LED states)
  - `users` (3 sample users)

## 🚀 Step 3: Deploy to Vercel

### 3.1 Prepare for Deployment

1. **Install Vercel CLI (optional):**
   ```bash
   npm i -g vercel
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env.local
   ```

3. **Update `.env.local` with your Firebase config:**
   ```env
   FIREBASE_PROJECT_ID=your-actual-project-id
   FIREBASE_API_KEY=your-actual-api-key
   FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   FIREBASE_APP_ID=your-actual-app-id
   
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
   NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-actual-app-id
   ```

### 3.2 Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **"New Project"**
   - Import your GitHub repository
   - Configure project settings:
     - Framework Preset: **Next.js**
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables:**
   - In Vercel project settings, go to **"Environment Variables"**
   - Add all variables from your `.env.local` file
   - Make sure to add both regular and `NEXT_PUBLIC_` versions

4. **Deploy:**
   - Click **"Deploy"**
   - Wait for build to complete
   - Your app will be available at `https://your-project.vercel.app`

#### Option B: Deploy via CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Follow the prompts:**
   - Set up and deploy: **Y**
   - Which scope: Select your account
   - Link to existing project: **N**
   - Project name: `smart-library-system`
   - Directory: **./** (current directory)

## 🔧 Step 4: Configure ESP32

### 4.1 Update ESP32 Code

1. **Open `esp32_led_control.ino`**
2. **Update WiFi credentials:**
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

3. **Update API URL:**
   ```cpp
   const char* apiUrl = "https://your-project.vercel.app/api/led/control";
   ```

### 4.2 Upload to ESP32

1. **Install Arduino IDE** and ESP32 board support
2. **Install required libraries:**
   - WiFi (built-in)
   - HTTPClient (built-in)
   - ArduinoJson (via Library Manager)

3. **Upload code:**
   - Select ESP32 board
   - Upload the code
   - Open Serial Monitor (115200 baud)

## 🧪 Step 5: Test the System

### 5.1 Test Website
1. Visit your Vercel deployment URL
2. Search for a book (e.g., "Algebra")
3. Click "Light Up" button
4. Verify the corresponding LED illuminates on ESP32

### 5.2 Test ESP32
1. Check Serial Monitor for:
   - WiFi connection status
   - LED test sequence
   - API polling messages

### 5.3 Test Firebase
1. Check Firebase Console for:
   - Search logs in `search_logs` collection
   - LED state updates in `led_states` collection

## 🔒 Step 6: Security Configuration

### 6.1 Firebase Security Rules

1. **Go to Firestore Database** → **Rules**
2. **Update rules for production:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write for authenticated users
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
       
       // Or for public read, authenticated write
       match /books/{document} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       match /led_states/{document} {
         allow read, write: if true; // For ESP32 access
       }
       
       match /search_logs/{document} {
         allow read: if request.auth != null;
         allow write: if true; // For logging
       }
     }
   }
   ```

### 6.2 Environment Variables Security

1. **Never commit `.env.local` to Git**
2. **Use Vercel environment variables** for production
3. **Rotate API keys** regularly

## 📊 Step 7: Monitoring and Analytics

### 7.1 Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and usage

### 7.2 Firebase Analytics
- Enable Firebase Analytics in Firebase Console
- Track user interactions and system usage

### 7.3 Custom Monitoring
- Check Firebase Console for:
  - Database usage
  - Error logs
  - Performance metrics

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check environment variables in Vercel
   - Verify Firebase configuration
   - Check build logs in Vercel dashboard

2. **ESP32 Connection Issues:**
   - Verify WiFi credentials
   - Check API URL in ESP32 code
   - Monitor Serial output for errors

3. **Firebase Connection Issues:**
   - Verify project ID in config files
   - Check Firebase security rules
   - Ensure Firestore is enabled

4. **LED Not Working:**
   - Check ESP32 wiring
   - Verify GPIO pin assignments
   - Test with Serial Monitor

## 📈 Production Optimization

### 1. Performance
- Enable Vercel Edge Functions
- Use Firebase caching
- Optimize images and assets

### 2. Security
- Implement user authentication
- Set up proper Firebase security rules
- Use HTTPS for all connections

### 3. Monitoring
- Set up error tracking (Sentry)
- Monitor API usage
- Track system performance

## 🎉 Deployment Complete!

Your Smart Library System is now deployed and ready to use!

**Live URL:** `https://your-project.vercel.app`

**Next Steps:**
1. Test all functionality
2. Configure monitoring
3. Set up user authentication (optional)
4. Scale as needed

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Vercel deployment logs
3. Check Firebase Console for errors
4. Monitor ESP32 Serial output

---

**Happy Deploying! 🚀**
