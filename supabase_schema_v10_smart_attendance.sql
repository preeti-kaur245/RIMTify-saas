-- DUAL ATTENDANCE ECOSYSTEM EXTENSION
-- Supporting Smart Classroom Code + Location Verification

-- 1. Attendance Sessions Table (Teacher Generated)
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID REFERENCES section_subject_allocations(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Attendance Table to support Smart Metadata
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS method VARCHAR(20) DEFAULT 'manual'; -- 'manual', 'smart_code', 'qr'
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES attendance_sessions(id) ON DELETE SET NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS gps_status VARCHAR(20); -- 'verified', 'out_of_range', 'disabled', 'mismatch'
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 3. RLS Policies
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can create sessions" ON attendance_sessions
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can view active sessions" ON attendance_sessions
    FOR SELECT USING (is_active = TRUE AND expires_at > NOW());

CREATE POLICY "Teachers can view their own sessions" ON attendance_sessions
    FOR SELECT USING (auth.uid() = teacher_id);

-- 4. Function to auto-expire sessions (optional, usually handled by frontend check too)
-- CREATE OR REPLACE FUNCTION expire_attendance_sessions() RETURNS void AS $$
-- BEGIN
--     UPDATE attendance_sessions SET is_active = FALSE WHERE expires_at < NOW();
-- END;
-- $$ LANGUAGE plpgsql;
