<!-- 106bf7c7-264a-41c7-a315-2dac4e257f52 614c67f9-bab9-4763-90eb-e8f6f40667ab -->
# Fix approval notifications and add receive-book flow

## Overview

Implement immediate in-app and email notifications when admins approve or decline book requests, and add a clear "book received/collected" flow that is reflected in both the admin book-requests page and the user dashboard.

## Plan

### 1. Wire admin approve/decline API to create user notifications

- Update `app/api/admin/book-requests-bulletproof/route.ts` `PUT` handler so that after a successful status update it:
- Loads the updated request's member and book metadata (member name/email, book title/author, due date).
- Inserts a row in `user_notifications` for the request's `member_id` with:
- **Approved**: `type` like `book_approved` or reuse `book_ready` if needed, title "Book Request Approved", and a message that includes book title and due date.
- **Declined**: `type` like `book_declined`, title "Book Request Declined", and a short reason-style message (generic text for now).
- Marks `is_read = false` and leaves `emailed_at` null so the notification shows in web UI and is eligible for email sending logic.
- If the current database `CHECK` constraint only allows a limited set of types (`deadline_reminder`, `book_ready`, etc.), add a note to also adjust the constraint via a small SQL migration so `book_approved`/`book_declined` (and any new types) are permitted.

### 2. Send Gmail emails immediately from the admin action

- In the same `PUT` handler, add an immediate server-side call to `app/api/email/send/route.ts`:
- Introduce an `APP_URL` constant using `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`.
- For **approve**, send an email to the member with subject like "Your book request has been approved" and a friendly body including book title and due date.
- For **decline**, send an email with subject like "Your book request could not be approved" and a short explanation.
- On success, update the corresponding `user_notifications` row with `emailed_at = now()` so the cron-based `/api/notifications/send-user-notifications` does not resend the same item.
- Log any failures with `console.error` but do not block the main approve/decline response.

### 3. Align cron-based email sender with the new behavior

- Review `app/api/notifications/send-user-notifications/route.ts`:
- Decide whether to keep excluding types like `book_ready` / `book_approved` or to rely solely on `emailed_at` for de-duplication.
- Adjust `EXCLUDED_NOTIFICATION_TYPES` and the query conditions so that only notifications without `emailed_at` are emailed, regardless of type, or explicitly ensure our new types (`book_approved`, `book_declined`, `book_received`) behave correctly.
- Keep the existing due-date and welcome notification behavior unchanged.

### 4. Update user-facing notification UIs

- In `app/user-dashboard/page.tsx` and `app/user-notifications/page.tsx`:
- Ensure the notifications list renders titles/messages from real `user_notifications` rows (already wired) and that the counts (notifications, ready books, etc.) still work with the new types.
- Extend the badge rendering logic so `book_approved`, `book_declined`, and later `book_received` show clear labels (e.g., "Approved", "Declined", "Book Collected").
- Verify that clicking a notification still calls `/api/user/notifications/[id]` and that unread counts decrement as expected.

### 5. Add explicit "book received/collected" flow

- Admin side (`app/admin/book-requests/page.tsx` and the `book-requests-bulletproof` API):
- Add a new action button (e.g., "Mark as Collected" / "Book Received") visible for approved/ready requests.
- Extend the `PUT` handler to support an additional `action` (e.g., `collect`) that updates `book_requests.status` to `collected` and sets `processed_date`.
- On this transition, insert a `user_notifications` row (type `book_received` or similar) telling the user the system has recorded that they picked up the book; send a matching Gmail email using `/api/email/send` and mark `emailed_at`.
- User side (`user-dashboard` and `user-notifications` pages):
- Reflect the `collected` status in stats (e.g., ready vs collected) if needed and show the new "book received" notification.

### 6. Testing and verification

- Add or use existing test scripts (e.g., `test-notifications.ps1`, `test-email.js`) to:
- Trigger a book request from a test user, then approve and decline via the admin UI and confirm:
- A new row appears in `user_notifications` with the correct type and message.
- The user dashboard and notifications pages show the new notification and increment counts.
- A Gmail email arrives with correct content for both approve and decline.
- Mark a request as collected and verify the new "book received" notification and email.
- Hit `/api/cron/send-notifications` (with `CRON_SECRET`) to ensure cron runs without double-sending already-emailed notifications.