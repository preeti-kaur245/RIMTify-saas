-- ADVANCED ACADEMIC STRUCTURE SCHEMA (v9)

-- 1. Departments (Extended)
ALTER TABLE departments ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_id UUID REFERENCES profiles(id);

-- 2. Programs (Extended)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('UG', 'PG', 'Diploma', 'PhD'));

-- 3. Subjects (Extended for v9)
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'theory' CHECK (type IN ('theory', 'lab', 'practical', 'seminar'));
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_elective BOOLEAN DEFAULT false;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS order_sequence INTEGER DEFAULT 0;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- 4. Section-Subject Allocations (The "Independent Subject List" per section)
CREATE TABLE IF NOT EXISTS section_subject_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, subject_id)
);

-- 5. Enhanced Faculty Assignments
-- We link faculty to the specific section-subject allocation
ALTER TABLE faculty_assignments 
ADD COLUMN IF NOT EXISTS allocation_id UUID REFERENCES section_subject_allocations(id) ON DELETE CASCADE;

-- 6. Timetable
CREATE TABLE IF NOT EXISTS timetable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID REFERENCES section_subject_allocations(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 7=Sun
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Semester History & Promotion Logs
CREATE TABLE IF NOT EXISTS academic_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL, -- 'promotion', 'migration', 'enrollment'
    description TEXT,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for new tables
ALTER TABLE section_subject_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for allocations" ON section_subject_allocations FOR SELECT USING (true);
CREATE POLICY "Public read for timetable" ON timetable FOR SELECT USING (true);

CREATE POLICY "Admin full access for allocations" ON section_subject_allocations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access for timetable" ON timetable FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access for logs" ON academic_logs FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Re-syncing Faculty Assignments
-- If we want to use the new allocation_id, we should migrate existing data if any.
-- For now, we keep subject_id and section_id for safety.
