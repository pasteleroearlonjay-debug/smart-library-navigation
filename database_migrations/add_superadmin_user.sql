-- Add superadmin user to admins table
-- Username: superadmin
-- Password: superadmin123

-- Insert superadmin user
INSERT INTO admins (username, email, password_hash, full_name, role, is_active) VALUES
('superadmin', 'superadmin@psau.edu.ph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Administrator', 'super_admin', true)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Note: The password hash above is for 'superadmin123' using bcrypt
-- Default password: superadmin123
-- IMPORTANT: Change the password after first login!

