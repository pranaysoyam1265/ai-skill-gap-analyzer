-- Create career_goals table
CREATE TABLE IF NOT EXISTS career_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current role information
  current_job_title TEXT,
  company TEXT,
  
  -- Target role information
  target_job_title TEXT,
  desired_industry TEXT,
  target_companies TEXT[] DEFAULT '{}',  -- JSON array stored as TEXT array
  
  -- Salary expectations
  salary_min NUMERIC(12, 2),
  salary_max NUMERIC(12, 2),
  salary_currency TEXT DEFAULT 'USD',
  
  -- Timeline and work preferences
  timeline_months INTEGER,  -- 3, 6, 12, 24
  preferred_work_modes TEXT[] DEFAULT '{}',  -- Remote, Hybrid, On-site
  target_locations TEXT[] DEFAULT '{}',  -- Multiple cities/countries
  
  -- Skills and certifications
  skills_to_acquire TEXT[] DEFAULT '{}',
  target_certifications TEXT[] DEFAULT '{}',
  
  -- Career milestones (stored as JSON text for flexibility)
  career_milestones JSONB DEFAULT '[]'::jsonb,
  
  -- Additional notes
  additional_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own career goals"
  ON career_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career goals"
  ON career_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career goals"
  ON career_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own career goals"
  ON career_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX idx_career_goals_user_id ON career_goals(user_id);
CREATE INDEX idx_career_goals_updated_at ON career_goals(updated_at DESC);
