-- 1. Materials Table
CREATE TABLE materials (
  id BIGSERIAL PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT, -- 'pdf', 'note', 'link'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Assignments Table
CREATE TABLE assignments (
  id BIGSERIAL PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Submissions Table
CREATE TABLE submissions (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  grade TEXT,
  feedback TEXT
);

-- 4. Notifications Table
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- If specific user, else null for global
  sender_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Payments/Subscriptions Table (Basic)
CREATE TABLE subscriptions (
  id BIGSERIAL PRIMARY KEY,
  college_name TEXT,
  plan_type TEXT, -- 'basic', 'pro', 'enterprise'
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  last_payment_date DATE
);

-- RLS Policies
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Materials Policies
CREATE POLICY "Materials viewable by all students/teachers." ON materials
  FOR SELECT USING (true);
CREATE POLICY "Teachers can manage their own materials." ON materials
  FOR ALL USING (auth.uid() = teacher_id);

-- Assignments Policies
CREATE POLICY "Assignments viewable by students/teachers." ON assignments
  FOR SELECT USING (true);
CREATE POLICY "Teachers can manage their own assignments." ON assignments
  FOR ALL USING (auth.uid() = teacher_id);

-- Submissions Policies
CREATE POLICY "Students can view/create their own submissions." ON submissions
  FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view submissions for their assignments." ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE assignments.id = submissions.assignment_id 
      AND assignments.teacher_id = auth.uid()
    )
  );

-- Notifications Policies
CREATE POLICY "Users can view their own notifications." ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create Storage Bucket for Materials (Manual step but SQL for documentation)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true);
