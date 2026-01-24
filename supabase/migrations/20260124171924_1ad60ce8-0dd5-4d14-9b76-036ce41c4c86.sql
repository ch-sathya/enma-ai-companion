-- Add personalization columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wake_word_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_voice TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL';

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);