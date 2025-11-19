-- SIMPLEST VERSION - Just Books Table & Data
-- Quick copy-paste for testing

CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    available BOOLEAN DEFAULT TRUE
);

INSERT INTO books (title, author, subject, available) VALUES
('Algebra Fundamentals', 'John Smith', 'Mathematics', TRUE),
('Calculus Made Easy', 'Mary Johnson', 'Mathematics', TRUE),
('Geometry Basics', 'David Wilson', 'Mathematics', FALSE),
('Physics Principles', 'Sarah Brown', 'Science', TRUE),
('Chemistry Basics', 'Michael Davis', 'Science', TRUE),
('Biology Essentials', 'Lisa Garcia', 'Science', TRUE),
('World History', 'Robert Martinez', 'Social Studies', TRUE),
('Philippine History', 'Ana Rodriguez', 'Social Studies', TRUE),
('Geography Today', 'Carlos Lopez', 'Social Studies', FALSE),
('Physical Education Guide', 'Maria Santos', 'PEHM', TRUE),
('Health and Wellness', 'Jose Cruz', 'PEHM', TRUE),
('Music Appreciation', 'Carmen Reyes', 'PEHM', TRUE),
('Moral Values', 'Pedro Torres', 'Values Education', TRUE),
('Character Building', 'Rosa Mendoza', 'Values Education', TRUE),
('Ethics and Society', 'Manuel Flores', 'Values Education', FALSE),
('Computer Programming', 'Luz Gonzales', 'TLE', TRUE),
('Cooking Basics', 'Antonio Rivera', 'TLE', TRUE),
('Electrical Wiring', 'Elena Morales', 'TLE', TRUE);




