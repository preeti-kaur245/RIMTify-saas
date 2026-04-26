-- 1. Fix Materials Table Policies
DROP POLICY IF EXISTS "Teachers can manage their own materials." ON materials;
CREATE POLICY "Teachers can manage their own materials." ON materials
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- 2. Fix Storage Policies (This requires the storage schema to exist)
-- Note: These policies should be run in the Supabase SQL Editor
-- They grant authenticated users permission to upload to the 'materials' bucket

-- Create bucket if not exists (only works if you have permission)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true) ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload to 'materials' bucket
CREATE POLICY "Allow authenticated uploads to materials"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materials');

-- Policy to allow anyone to view 'materials'
CREATE POLICY "Allow public viewing of materials"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'materials');

-- Policy to allow users to update/delete their own uploads
CREATE POLICY "Allow users to manage their own uploads"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'materials' AND owner = auth.uid())
WITH CHECK (bucket_id = 'materials' AND owner = auth.uid());

-- 3. Fix Assignments Table Policies
DROP POLICY IF EXISTS "Teachers can manage their own assignments." ON assignments;
CREATE POLICY "Teachers can manage their own assignments." ON assignments
  FOR ALL TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);
