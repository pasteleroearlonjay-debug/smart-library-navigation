<!-- f1d0fbe3-ea90-4f01-a93b-a59c7a29a577 735fc444-f69a-4d43-aef2-83ce0eb6d3e1 -->
# Update Dashboard to Show Real Data for New Users

## Overview

The dashboard currently shows hardcoded sample data. For new users, it should only show:

- One notification: "Welcome to Smart Library" 
- All stats at 0 (Books Borrowed, Overdue Items, Ready Books)
- Empty recent activity
- No welcome email sent

## Changes Required

### 1. Update Notifications API (`app/api/user/notifications/route.ts`)

- Replace hardcoded sample notifications with database queries
- Fetch notifications from `user_notifications` table for the authenticated user
- For new users, only return the welcome notification
- Calculate unread count from actual database data

### 2. Update User Dashboard (`app/user-dashboard/page.tsx`)

- Replace hardcoded "Ready Books: 2" with real data from database
- Load ready books count from `book_requests` table (status = 'ready')
- Show empty recent activity for new users (no hardcoded activities)
- Ensure all stats reflect real database values

### 3. Update Welcome Notification Message (`app/api/user/signup/route.ts`)

- Change welcome notification message to: "Welcome! You can now search for books and get LED guidance to their locations."
- Keep the title as "Welcome to Smart Library"

### 4. Email Configuration

- **Welcome notification**: Send Gmail email when user signs up (in addition to in-app notification)
- **Book accepted/approved**: In-app notification only, NO email
- **Book ready**: In-app notification only, NO email
- Update email sending service to exclude book_approved and book_ready types

## Files to Modify

1. `app/api/user/notifications/route.ts` - Fetch real notifications from database
2. `app/user-dashboard/page.tsx` - Use real data for stats and recent activity
3. `app/api/user/signup/route.ts` - Update welcome notification message
4. May need to create API endpoint for dashboard stats if not exists