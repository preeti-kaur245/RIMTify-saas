-- 1. Grades / Results Table
CREATE TABLE IF NOT EXISTS grades (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL, -- 'internal', 'mid-term', 'final'
  marks DECIMAL(5,2),
  total_marks DECIMAL(5,2) DEFAULT 100.00,
  grade TEXT, -- 'A', 'B+', etc.
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, course_id, exam_type)
);

-- Enable RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own grades." ON grades FOR SELECT 
  USING (auth.uid() = student_id OR auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can manage grades for their courses." ON grades FOR ALL TO authenticated 
  USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
