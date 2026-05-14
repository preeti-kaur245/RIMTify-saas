-- ATTENDANCE RLS FIX
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can mark their own attendance" ON attendance;
CREATE POLICY "Students can mark their own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Faculty can mark attendance" ON attendance;
CREATE POLICY "Faculty can mark attendance" ON attendance
    FOR ALL USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    ));

DROP POLICY IF EXISTS "Students can view their own attendance" ON attendance;
CREATE POLICY "Students can view their own attendance" ON attendance
    FOR SELECT USING (auth.uid() = student_id);
