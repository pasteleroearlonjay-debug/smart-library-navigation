-- Fix borrowing_records table structure
-- Run this first to ensure the borrowing_records table has the correct structure

-- Check if borrowing_records table exists and has correct structure
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowing_records') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE borrowing_records (
            id BIGSERIAL PRIMARY KEY,
            member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
            book_id BIGINT,
            book_title VARCHAR(255),
            borrowed_date DATE NOT NULL,
            due_date DATE NOT NULL,
            returned_date DATE,
            status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Created borrowing_records table';
    ELSE
        -- Table exists, check if member_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'member_id') THEN
            -- Add member_id column if it doesn't exist
            ALTER TABLE borrowing_records ADD COLUMN member_id BIGINT;
            
            -- Add foreign key constraint
            ALTER TABLE borrowing_records ADD CONSTRAINT borrowing_records_member_id_fkey 
                FOREIGN KEY (member_id) REFERENCES library_members(id) ON DELETE CASCADE;
                
            RAISE NOTICE 'Added member_id column to borrowing_records table';
        ELSE
            RAISE NOTICE 'borrowing_records table already has correct structure';
        END IF;
    END IF;
END $$;

-- Create indexes for borrowing_records
CREATE INDEX IF NOT EXISTS idx_borrowing_records_member_id ON borrowing_records(member_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_due_date ON borrowing_records(due_date);

-- Insert sample borrowing records if the table is empty
INSERT INTO borrowing_records (member_id, book_title, borrowed_date, due_date, status) 
SELECT 
    lm.id as member_id,
    'Sample Book ' || lm.id as book_title,
    CURRENT_DATE - INTERVAL '10 days' as borrowed_date,
    CURRENT_DATE + INTERVAL '14 days' as due_date,
    'borrowed' as status
FROM library_members lm
WHERE NOT EXISTS (SELECT 1 FROM borrowing_records WHERE member_id = lm.id)
LIMIT 5;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'borrowing_records' 
ORDER BY ordinal_position;

