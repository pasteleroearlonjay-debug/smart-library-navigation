-- Fix Admin Password Hashes
-- This migration updates the password hashes to use proper bcrypt hashes
-- that are compatible with Node.js bcryptjs library
--
-- Default passwords:
-- - admin: admin123
-- - superadmin: superadmin123
-- - librarian1: admin123
-- - librarian2: admin123

-- Update admin password hash (password: admin123)
UPDATE admins 
SET password_hash = '$2b$10$llP6ix0fMHEvgQZGaEyOWeVaNCcZs6Xwc9urLj7b/LWIuu6ntBWh.',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- Update superadmin password hash (password: superadmin123)
UPDATE admins 
SET password_hash = '$2b$10$slVcdr2w6R6le3GCRh8yHeC1q9OrnIrfQYzllEpVyRj5fcuZEmaQS',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'superadmin';

-- Update librarian1 password hash (password: admin123)
UPDATE admins 
SET password_hash = '$2b$10$llP6ix0fMHEvgQZGaEyOWeVaNCcZs6Xwc9urLj7b/LWIuu6ntBWh.',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'librarian1';

-- Update librarian2 password hash (password: admin123)
UPDATE admins 
SET password_hash = '$2b$10$llP6ix0fMHEvgQZGaEyOWeVaNCcZs6Xwc9urLj7b/LWIuu6ntBWh.',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'librarian2';

-- Verify the updates
SELECT username, email, role, is_active, 
       CASE 
         WHEN password_hash LIKE '$2b$%' THEN 'Valid bcryptjs hash'
         WHEN password_hash LIKE '$2y$%' THEN 'PHP bcrypt hash (may need conversion)'
         ELSE 'Unknown format'
       END as hash_format
FROM admins
ORDER BY username;

