
ALTER TABLE public.user_preferences ADD COLUMN key_info JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_preferences.key_info IS 'Open-ended JSONB field for storing any additional user details and preferences as key-value pairs.';
