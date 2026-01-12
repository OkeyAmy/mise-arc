
CREATE TABLE public.user_leftovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_name TEXT NOT NULL,
    servings NUMERIC NOT NULL DEFAULT 1,
    date_created DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_leftovers IS 'Stores leftover meals for users.';

-- Enable Row Level Security
ALTER TABLE public.user_leftovers ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Users can view their own leftovers"
ON public.user_leftovers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leftovers"
ON public.user_leftovers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leftovers"
ON public.user_leftovers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leftovers"
ON public.user_leftovers FOR DELETE
USING (auth.uid() = user_id);

-- Enable Realtime
ALTER TABLE public.user_leftovers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_leftovers;
