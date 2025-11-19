# Admin Login Setup Guide

This guide will help you set up the admin login system for the Smart Library System.

## Overview

The system now includes:
- **Welcome/Login Page** - Admin authentication required to access the dashboard
- **Admin Management** - Secure admin user database with activity logging
- **Session Management** - Token-based authentication
- **Protected Routes** - Dashboard and other pages require login

## 📋 Prerequisites

1. **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)
2. **Node.js** - Version 18 or higher
3. **npm** or **yarn** package manager

## 🔧 Installation Steps

### 1. Install Required Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Firebase (if still using)
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script: `supabase_admin_setup.sql`
   - This creates the `admins` table
   - Creates the `admin_activity_logs` table
   - Inserts default admin user
   - Sets up indexes and triggers

```sql
-- The script creates:
-- ✓ admins table with secure password hashing
-- ✓ admin_activity_logs for tracking actions
-- ✓ Indexes for performance
-- ✓ Auto-update triggers for timestamps
-- ✓ Default admin user
```

### 4. Verify Database Setup

Run these verification queries in Supabase SQL Editor:

```sql
-- Check if admin was created
SELECT * FROM admins;

-- View admin summary
SELECT * FROM admin_summary;
```

## 🔐 Default Login Credentials

After running the SQL setup, you can log in with:

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change the default password after your first login!

### Additional Admin Users

The setup also creates these accounts:

| Username | Email | Role |
|----------|-------|------|
| admin | admin@library.com | super_admin |
| librarian1 | librarian1@library.com | admin |
| librarian2 | librarian2@library.com | admin |

All use the default password: `admin123`

## 🚀 Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser to: `http://localhost:3000`
3. You'll be redirected to the login page
4. Enter your admin credentials
5. Access the dashboard after successful login

## 📁 File Structure

```
smart-library-system/
├── app/
│   ├── login/
│   │   └── page.tsx              # Login page (welcome page)
│   ├── dashboard/
│   │   └── page.tsx              # Main dashboard (protected)
│   ├── api/
│   │   └── auth/
│   │       ├── login/
│   │       │   └── route.ts      # Login API endpoint
│   │       └── logout/
│   │           └── route.ts      # Logout API endpoint
│   └── page.tsx                  # Root - redirects to login
├── components/
│   └── navigation.tsx            # Updated with logout
├── supabase_admin_setup.sql      # Admin database setup
└── ADMIN_LOGIN_SETUP.md         # This file
```

## 🔒 Security Features

1. **Password Hashing** - All passwords stored as bcrypt hashes
2. **Session Tokens** - Temporary tokens stored in localStorage
3. **Activity Logging** - All admin actions are logged
4. **Active Status** - Admins can be deactivated without deletion
5. **Last Login Tracking** - Timestamp of last successful login
6. **IP Address Logging** - Track login locations

## 🛠️ Customization

### Adding New Admin Users

You can add new admins via SQL:

```sql
INSERT INTO admins (username, email, password_hash, full_name, role, is_active) 
VALUES (
  'new_admin',
  'newadmin@library.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'New Administrator',
  'admin',
  true
);
```

### Changing Password Hashing (Production)

For production, implement proper bcrypt hashing:

1. Install bcryptjs:
```bash
npm install bcryptjs @types/bcryptjs
```

2. Update `app/api/auth/login/route.ts`:
```typescript
import bcrypt from 'bcryptjs'

// Replace the simple password check with:
const isValidPassword = await bcrypt.compare(password, admin.password_hash)
```

### Creating Password Hashes

To create a new password hash:

```javascript
const bcrypt = require('bcryptjs')
const hash = await bcrypt.hash('your_password', 10)
console.log(hash)
```

## 🔄 Session Management

Sessions are stored in `localStorage`:
- `adminToken` - Authentication token
- `adminUser` - Admin user data (id, username, email, fullName, role)

Sessions persist across page refreshes but are cleared on logout.

## 🚨 Troubleshooting

### Login not working?

1. Check Supabase URL and keys in `.env.local`
2. Verify admin table exists in Supabase
3. Check browser console for errors
4. Ensure default admin was created

### Redirecting to login repeatedly?

1. Check if token is being saved to localStorage
2. Verify `/dashboard` route is accessible
3. Check browser console for JavaScript errors

### Database connection errors?

1. Verify Supabase project is active
2. Check environment variables are loaded
3. Restart the development server

## 📊 Admin Activity Logs

View admin activities in Supabase:

```sql
SELECT 
  a.username,
  aal.action,
  aal.description,
  aal.created_at,
  aal.ip_address
FROM admin_activity_logs aal
JOIN admins a ON aal.admin_id = a.id
ORDER BY aal.created_at DESC
LIMIT 50;
```

## 🔐 Production Deployment

Before deploying to production:

1. ✅ Change all default passwords
2. ✅ Implement proper bcrypt password hashing
3. ✅ Use secure JWT tokens instead of simple base64
4. ✅ Enable HTTPS only
5. ✅ Set up proper CORS policies
6. ✅ Enable Row Level Security (RLS) in Supabase
7. ✅ Add rate limiting to login endpoint
8. ✅ Implement password reset functionality
9. ✅ Add two-factor authentication (optional)
10. ✅ Review and update security policies

## 📝 Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Role-based permissions
- [ ] Admin user management UI
- [ ] Session timeout warnings
- [ ] Remember me functionality
- [ ] Audit log viewer in dashboard

## 📞 Support

For issues or questions:
1. Check the main `README.md`
2. Review `DEPLOYMENT_GUIDE.md`
3. Check Supabase documentation
4. Review browser console for errors

---

**Note:** This is a development setup. For production use, implement additional security measures as outlined in the "Production Deployment" section.



