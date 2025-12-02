-- Create user_skills table to track skills learned/tracked by users
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT,
  proficiency_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
  date_added TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS on user_skills table
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skills" ON user_skills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills" ON user_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills" ON user_skills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills" ON user_skills
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_skills_user_id_idx ON user_skills(user_id);

-- Create gap_analyses table to track skill gap analyses
CREATE TABLE IF NOT EXISTS gap_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  match_score INTEGER NOT NULL,
  critical_gaps INTEGER DEFAULT 0,
  skills_to_improve INTEGER DEFAULT 0,
  matching_skills TEXT[] DEFAULT '{}',
  gaps_details TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  date_analyzed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS on gap_analyses table
ALTER TABLE gap_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses" ON gap_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON gap_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON gap_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS gap_analyses_user_id_idx ON gap_analyses(user_id);
CREATE INDEX IF NOT EXISTS gap_analyses_date_idx ON gap_analyses(date_analyzed DESC);

-- Create course_enrollments table to track enrolled courses
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_provider TEXT, -- Coursera, Udemy, LinkedIn Learning, etc.
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE,
  duration_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'enrolled', -- enrolled, in-progress, completed, dropped
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS on course_enrollments table
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments" ON course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments" ON course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON course_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments" ON course_enrollments
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS course_enrollments_user_id_idx ON course_enrollments(user_id);

-- Create learning_sessions table to track learning time
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- course, practice, reading, project, etc.
  duration_minutes INTEGER NOT NULL,
  topic TEXT,
  date_logged TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS on learning_sessions table
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON learning_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS learning_sessions_user_id_idx ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS learning_sessions_date_idx ON learning_sessions(date_logged DESC);
