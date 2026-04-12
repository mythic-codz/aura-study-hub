
-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_index INTEGER NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(batch_id, content_type, content_index)
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Service can insert quizzes" ON public.quizzes FOR INSERT WITH CHECK (true);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 5,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quiz attempts" ON public.quiz_attempts FOR SELECT
  USING (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users insert own quiz attempts" ON public.quiz_attempts FOR INSERT
  WITH CHECK (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  batch_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_index INTEGER NOT NULL,
  timestamp_pos NUMERIC NOT NULL DEFAULT 0,
  text TEXT NOT NULL DEFAULT '',
  is_bookmark BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notes" ON public.notes FOR SELECT
  USING (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users insert own notes" ON public.notes FOR INSERT
  WITH CHECK (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users update own notes" ON public.notes FOR UPDATE
  USING (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users delete own notes" ON public.notes FOR DELETE
  USING (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_studied INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, study_date)
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON public.study_sessions FOR SELECT
  USING (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users insert own sessions" ON public.study_sessions FOR INSERT
  WITH CHECK (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users update own sessions" ON public.study_sessions FOR UPDATE
  USING (user_id = (SELECT users.id FROM users WHERE users.device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

-- Add streak columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;
