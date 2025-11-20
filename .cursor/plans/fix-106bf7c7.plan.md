<!-- 8c8e50e3-9ac2-4a4c-a084-8ca7a03e1740 140f2e32-ed47-4519-b9ee-0ca17f0e50f4 -->
# Fix timers and notifications with real data

## Overview

Redesign timer components for better visual appeal, add countdown timers to admin Book Requests page, fix Due Soon section to show real borrowed books with working timers, and ensure notifications display real data from database.

## Implementation Plan

### 1. Improve User Dashboard Timer Design

- **File**: `app/user-dashboard/page.tsx`
- Redesign the countdown timer display in "Due Soon" section:
- Replace simple badge with a more prominent timer card design
- Add visual countdown with hours, minutes, seconds in separate boxes
- Use color coding: green for >12h, yellow for 6-12h, orange for 1-6h, red for <1h or overdue
- Add progress bar showing time remaining
- Make timer more visually prominent and easier to read

### 2. Add Countdown Timers to Admin Book Requests Page

- **File**: `app/admin/book-requests/page.tsx`
- Add countdown timer column/display in the book requests table:
- Add new column or enhance "Due Date" column to show live countdown
- Show countdown only for requests with status: 'accepted', 'approved', 'ready', 'collected'
- Use same timer design style as user dashboard for consistency
- Add real-time updates (every second) for countdown
- Display timer showing time until/after due date

### 3. Fix Due Soon Section to Show Real Data

- **Files**: 
- `app/api/user/notifications/route.ts` (backend)
- `app/user-dashboard/page.tsx` (frontend)
- Ensure Due Soon section pulls from actual `borrowing_records` table:
- Query books with status 'borrowed' where due_date is within 24 hours or overdue
- Include books from `book_requests` that are approved/accepted and have due dates
- Return books with proper due_date, book_title, member_id
- Display all books that are due soon, not just from borrowing_records
- Show countdown timer for each book
- Handle empty state properly

### 4. Fix Notifications to Show Real Data

- **Files**:
- `app/api/user/notifications/route.ts` (ensure proper query)
- `app/user-dashboard/page.tsx` (ensure proper display)
- `app/api/admin/book-requests-bulletproof/route.ts` (ensure notifications are created)
- Verify notifications are being created when:
- Admin approves/declines book request
- Admin marks book as collected
- Book becomes due within 24 hours (cron job)
- Book becomes overdue (cron job)
- Ensure notifications query properly filters by member_id
- Add debug logging to track notification creation and retrieval
- Display all notification types: book_approved, book_declined, book_received, deadline_reminder, overdue_notice

### 5. Ensure Stats Cards Show Real Data

- **File**: `app/api/user/notifications/route.ts`
- Verify stats are calculated from real database queries:
- Books Borrowed: Count from `borrowing_records` where status = 'borrowed'
- Overdue Items: Count from `borrowing_records` where due_date < today
- Ready Books: Count from `book_requests` where status = 'ready' and member_id matches
- Collected Books: Count from `book_requests` where status = 'collected' and member_id matches
- Add proper error handling for missing tables

### 6. Add Real-Time Updates for Admin Page

- **File**: `app/admin/book-requests/page.tsx`
- Add timer state and auto-refresh:
- Add `currentTime` state that updates every second
- Add auto-refresh for book requests data every 30 seconds
- Implement countdown timer formatting function similar to user dashboard

## Files to Modify

1. `app/user-dashboard/page.tsx` - Timer design improvements, notification display fixes
2. `app/admin/book-requests/page.tsx` - Add countdown timers, real-time updates
3. `app/api/user/notifications/route.ts` - Fix Due Soon query, ensure real data
4. `app/api/admin/book-requests-bulletproof/route.ts` - Ensure notifications are created (already done, verify)