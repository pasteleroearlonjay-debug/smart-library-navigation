-- Adds new notification types needed for approval/decline/collection flow
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_notifications'
  ) THEN
    BEGIN
      EXECUTE 'ALTER TABLE user_notifications DROP CONSTRAINT IF EXISTS user_notifications_type_check';
      EXECUTE $sql$
        ALTER TABLE user_notifications
        ADD CONSTRAINT user_notifications_type_check CHECK (
          type IN (
            'deadline_reminder',
            'book_ready',
            'overdue_notice',
            'welcome',
            'email_verification',
            'book_request',
            'book_approved',
            'book_declined',
            'book_received'
          )
        )
      $sql$;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not update user_notifications_type_check: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'user_notifications table not found. Skipping constraint update.';
  END IF;
END $$;


