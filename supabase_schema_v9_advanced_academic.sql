-- Advanced Academic System Upgrades

-- 1. Enhance Subjects Table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS credits FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_practical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_elective BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Enhance Faculty Assignments
ALTER TABLE faculty_assignments
ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'co-faculty', 'substitute', 'lab')),
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Enhance Student Enrollments
ALTER TABLE student_enrollments
ADD COLUMN IF NOT EXISTS academic_session TEXT, -- e.g. 'Jan-Jun 2026'
ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;

-- 4. Create Departments if missing some common ones
INSERT INTO departments (name) VALUES 
('Computer Applications'), 
('Engineering'), 
('Management'), 
('Science'), 
('Commerce')
ON CONFLICT (name) DO NOTHING;

-- 5. Add practical/theory/lab check constraint to subjects type if needed
-- (Existing type was CHECK (type IN ('core', 'elective', 'lab')))
-- Let's stick with the columns for more flexibility.

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_sections_semester ON sections(semester_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON student_enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_teacher ON faculty_assignments(teacher_id);
