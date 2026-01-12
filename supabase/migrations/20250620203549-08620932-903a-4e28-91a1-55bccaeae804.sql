
-- Create a table to store shared shopping lists
CREATE TABLE public.shared_shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE,
  shared_by_user_id UUID REFERENCES auth.users NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  title TEXT DEFAULT 'Shared Shopping List'
);

-- Add Row Level Security
ALTER TABLE public.shared_shopping_lists ENABLE ROW LEVEL SECURITY;

-- Policy to allow the creator to read their shared lists
CREATE POLICY "Users can view their own shared lists" 
  ON public.shared_shopping_lists 
  FOR SELECT 
  USING (auth.uid() = shared_by_user_id);

-- Policy to allow authenticated users to read shared lists via token (for accessing shared links)
CREATE POLICY "Anyone can view shared lists with valid token" 
  ON public.shared_shopping_lists 
  FOR SELECT 
  USING (expires_at > now());

-- Policy to allow users to create shared lists
CREATE POLICY "Users can create shared lists" 
  ON public.shared_shopping_lists 
  FOR INSERT 
  WITH CHECK (auth.uid() = shared_by_user_id);

-- Create index for performance
CREATE INDEX idx_shared_shopping_lists_token ON public.shared_shopping_lists(share_token);
CREATE INDEX idx_shared_shopping_lists_expires ON public.shared_shopping_lists(expires_at);
