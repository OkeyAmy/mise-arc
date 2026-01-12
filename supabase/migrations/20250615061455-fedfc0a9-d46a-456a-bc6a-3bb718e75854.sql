
-- Add columns for cultural heritage, family size, and notes to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN cultural_heritage TEXT,
ADD COLUMN family_size INTEGER,
ADD COLUMN notes TEXT;
