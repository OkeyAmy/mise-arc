
-- Enable RLS for user_leftovers
ALTER TABLE public.user_leftovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own leftovers"
ON public.user_leftovers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
