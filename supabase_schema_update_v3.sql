-- Update Attendance table with session and notes
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_no INTEGER DEFAULT 1;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS lecture_note TEXT;

-- Index for faster history lookups
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date_session ON attendance(teacher_id, date, session_no);

-- Ensure profiles has roll_no for students
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'roll_no') THEN
    ALTER TABLE profiles ADD COLUMN roll_no TEXT;
  END IF;
END $$;
