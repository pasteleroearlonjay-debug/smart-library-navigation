-- Smart Library System - Admin Setup for Supabase
-- Run this in Supabase SQL Editor to create the admin table and admin user

-- ========================================
-- ADMIN TABLE
-- ========================================

-- Create admin table
CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- ========================================
-- INSERT DEFAULT ADMIN USER
-- ========================================

-- Default admin credentials:
-- Username: admin
-- Password: admin123 (Please change this after first login!)
-- The password hash below is for 'admin123' using bcrypt

INSERT INTO admins (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'super_admin', true)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Insert additional admin users (optional)
INSERT INTO admins (username, email, password_hash, full_name, role, is_active) VALUES
('librarian1', 'librarian1@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Head Librarian', 'admin', true),
('librarian2', 'librarian2@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Assistant Librarian', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- ========================================
-- ADMIN ACTIVITY LOGS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for admin activity logs
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);

-- ========================================
-- CREATE FUNCTION: Auto-update updated_at timestamp
-- ========================================

CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE TRIGGER: Auto-update timestamps
-- ========================================

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins
    FOR EACH ROW 
    EXECUTE FUNCTION update_admin_updated_at();

-- ========================================
-- CREATE FUNCTION: Update last login
-- ========================================

CREATE OR REPLACE FUNCTION update_admin_last_login(admin_id_param BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE admins 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = admin_id_param;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE VIEW: Admin Summary
-- ========================================

CREATE OR REPLACE VIEW admin_summary AS
SELECT 
    a.id,
    a.username,
    a.email,
    a.full_name,
    a.role,
    a.is_active,
    a.last_login,
    a.created_at,
    COUNT(aal.id) as total_activities,
    MAX(aal.created_at) as last_activity
FROM admins a
LEFT JOIN admin_activity_logs aal ON a.id = aal.admin_id
GROUP BY a.id, a.username, a.email, a.full_name, a.role, a.is_active, a.last_login, a.created_at
ORDER BY a.created_at DESC;

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS) - Optional
-- ========================================

-- Uncomment these lines if you want to enable Row Level Security
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only (if RLS is enabled)
-- CREATE POLICY "Admins can view all admins" ON admins FOR SELECT USING (true);
-- CREATE POLICY "Admins can update themselves" ON admins FOR UPDATE USING (auth.uid()::text = id::text);

-- ========================================
-- VERIFICATION QUERIES
-- Run these to verify everything was created successfully
-- ========================================

-- Check if admin was inserted
-- SELECT * FROM admins;

-- View admin summary
-- SELECT * FROM admin_summary;

-- Test login query (replace 'admin' with actual username)
-- SELECT id, username, email, password_hash, full_name, role, is_active 
-- FROM admins 
-- WHERE username = 'admin' AND is_active = true;

-- ========================================
-- NOTES
-- ========================================

-- DEFAULT ADMIN CREDENTIALS:
-- Username: admin
-- Password: admin123
-- 
-- IMPORTANT: Change the default password after first login!
-- 
-- The password hash is generated using bcrypt.
-- In your application, use a proper password hashing library like bcryptjs
-- to verify and hash passwords.



