# Test Email Notifications in Production

## Quick Test Guide for Deployed Environment

### Step 1: Create Test Data in Supabase

You need to create test borrowing records with books due within 3 days or overdue.

#### Option A: Create Test Borrowing Record (Due in 1 Day)

Run this SQL in Supabase SQL Editor:

```sql
-- First, get a member ID (replace with your actual member email)
DO $$
DECLARE
    member_id_var BIGINT;
    book_id_var BIGINT;
BEGIN
    -- Get member ID (replace email with your test user's email)
    SELECT id INTO member_id_var 
    FROM library_members 
    WHERE email = 'pasteleroearlonjay@gmail.com' 
    LIMIT 1;
    
    -- Get a book ID (or use NULL if book_id is optional)
    SELECT id INTO book_id_var 
    FROM books 
    LIMIT 1;
    
    -- Create borrowing record due in 1 day
    INSERT INTO borrowing_records (
        member_id,
        book_id,
        book_title,
        borrowed_date,
        due_date,
        status,
        last_reminder_sent
    ) VALUES (
        member_id_var,
        book_id_var,
        'Test Book - Due Tomorrow',
        CURRENT_DATE - 10,  -- Borrowed 10 days ago
        CURRENT_DATE + 1,   -- Due tomorrow (1 day from now)
        'borrowed',
        NULL  -- No reminder sent yet
    );
    
    RAISE NOTICE 'Test borrowing record created for member ID: %', member_id_var;
END $$;
```

#### Option B: Create Test Borrowing Record (Overdue)

```sql
-- Create overdue book (due yesterday)
DO $$
DECLARE
    member_id_var BIGINT;
    book_id_var BIGINT;
BEGIN
    SELECT id INTO member_id_var 
    FROM library_members 
    WHERE email = 'pasteleroearlonjay@gmail.com' 
    LIMIT 1;
    
    SELECT id INTO book_id_var FROM books LIMIT 1;
    
    INSERT INTO borrowing_records (
        member_id,
        book_id,
        book_title,
        borrowed_date,
        due_date,
        status,
        last_reminder_sent
    ) VALUES (
        member_id_var,
        book_id_var,
        'Test Book - Overdue',
        CURRENT_DATE - 15,  -- Borrowed 15 days ago
        CURRENT_DATE - 1,   -- Due yesterday (overdue)
        'borrowed',
        NULL
    );
    
    RAISE NOTICE 'Overdue test record created';
END $$;
```

#### Option C: Create Multiple Test Records (Due in 1, 2, 3 days)

```sql
-- Create multiple test records
DO $$
DECLARE
    member_id_var BIGINT;
    book_id_var BIGINT;
BEGIN
    SELECT id INTO member_id_var 
    FROM library_members 
    WHERE email = 'pasteleroearlonjay@gmail.com' 
    LIMIT 1;
    
    SELECT id INTO book_id_var FROM books LIMIT 1;
    
    -- Due in 1 day
    INSERT INTO borrowing_records (member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent)
    VALUES (member_id_var, book_id_var, 'Test Book - Due in 1 Day', CURRENT_DATE - 10, CURRENT_DATE + 1, 'borrowed', NULL);
    
    -- Due in 2 days
    INSERT INTO borrowing_records (member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent)
    VALUES (member_id_var, book_id_var, 'Test Book - Due in 2 Days', CURRENT_DATE - 10, CURRENT_DATE + 2, 'borrowed', NULL);
    
    -- Due in 3 days
    INSERT INTO borrowing_records (member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent)
    VALUES (member_id_var, book_id_var, 'Test Book - Due in 3 Days', CURRENT_DATE - 10, CURRENT_DATE + 3, 'borrowed', NULL);
    
    -- Overdue
    INSERT INTO borrowing_records (member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent)
    VALUES (member_id_var, book_id_var, 'Test Book - Overdue', CURRENT_DATE - 15, CURRENT_DATE - 1, 'borrowed', NULL);
    
    RAISE NOTICE 'Multiple test records created';
END $$;
```

#### Option D: Create Test User Notification

```sql
-- Create a test user notification
DO $$
DECLARE
    member_id_var BIGINT;
BEGIN
    SELECT id INTO member_id_var 
    FROM library_members 
    WHERE email = 'pasteleroearlonjay@gmail.com' 
    LIMIT 1;
    
    INSERT INTO user_notifications (
        member_id,
        type,
        title,
        message,
        is_read,
        emailed_at
    ) VALUES (
        member_id_var,
        'book_ready',
        'Test Book Ready Notification',
        'Your requested book "Test Book" is ready for pickup at the library!',
        false,
        NULL  -- Not emailed yet
    );
    
    RAISE NOTICE 'Test user notification created';
END $$;
```

---

### Step 2: Test on Production

Replace `YOUR_VERCEL_URL` with your actual Vercel deployment URL.

#### Test Due Book Reminders:

```powershell
# Replace with your actual Vercel URL
$PROD_URL = "https://smart-library-navigation.vercel.app"

Invoke-RestMethod -Uri "$PROD_URL/api/notifications/send-due-reminders" `
  -Method POST `
  -ContentType "application/json"
```

#### Test User Notifications:

```powershell
Invoke-RestMethod -Uri "$PROD_URL/api/notifications/send-user-notifications" `
  -Method POST `
  -ContentType "application/json"
```

#### Test Cron Endpoint:

```powershell
$CRON_SECRET = "01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5"

Invoke-RestMethod -Uri "$PROD_URL/api/cron/send-notifications?secret=$CRON_SECRET" `
  -Method GET
```

---

### Step 3: Verify Results

1. **Check Your Email:**
   - Check `pasteleroearlonjay@gmail.com` inbox
   - Check spam folder
   - You should receive reminder emails

2. **Check Database:**
   ```sql
   -- Check if reminders were sent
   SELECT * FROM borrowing_records 
   WHERE book_title LIKE 'Test Book%' 
   ORDER BY due_date;
   
   -- Check last_reminder_sent was updated
   SELECT book_title, due_date, last_reminder_sent, status 
   FROM borrowing_records 
   WHERE book_title LIKE 'Test Book%';
   
   -- Check email_notifications table
   SELECT * FROM email_notifications 
   ORDER BY created_at DESC 
   LIMIT 10;
   
   -- Check user_notifications emailed_at
   SELECT * FROM user_notifications 
   WHERE title LIKE 'Test%' 
   ORDER BY created_at DESC;
   ```

---

### Step 4: Clean Up Test Data (Optional)

After testing, you can remove test data:

```sql
-- Remove test borrowing records
DELETE FROM borrowing_records 
WHERE book_title LIKE 'Test Book%';

-- Remove test user notifications
DELETE FROM user_notifications 
WHERE title LIKE 'Test%';
```

---

## Quick Test Script for Production

Save this as `test-production.ps1`:

```powershell
# Production Test Script
$PROD_URL = "https://smart-library-navigation.vercel.app"  # CHANGE THIS
$CRON_SECRET = "01b3a712a25673e9e527ab7b7f8c6d7f62d57361a289b4da16145945ffef2de5"

Write-Host "🧪 Testing Production Email Notifications" -ForegroundColor Cyan
Write-Host "Production URL: $PROD_URL" -ForegroundColor Yellow
Write-Host ""

# Test Due Reminders
Write-Host "📚 Testing Due Book Reminders..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$PROD_URL/api/notifications/send-due-reminders" -Method POST
    Write-Host "✅ Sent: $($response.sent), Failed: $($response.failed)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test User Notifications
Write-Host "👤 Testing User Notifications..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$PROD_URL/api/notifications/send-user-notifications" -Method POST
    Write-Host "✅ Sent: $($response.sent), Failed: $($response.failed)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ Check your email inbox!" -ForegroundColor Cyan
```

---

## Important Notes

1. **Make sure your Vercel URL is correct** - Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
2. **Check member email exists** - The test SQL uses `pasteleroearlonjay@gmail.com`, make sure this member exists in `library_members` table
3. **Books must be 'borrowed' status** - Only books with `status = 'borrowed'` will trigger reminders
4. **Due date must be within 3 days** - The system sends reminders for books due within 3 days OR already overdue

