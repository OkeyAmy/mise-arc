
-- Create table to store Amazon search results for caching
CREATE TABLE public.amazon_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  product_query TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  search_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_query, country)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.amazon_search_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own Amazon search cache" 
  ON public.amazon_search_cache 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Amazon search cache" 
  ON public.amazon_search_cache 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Amazon search cache" 
  ON public.amazon_search_cache 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Amazon search cache" 
  ON public.amazon_search_cache 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_amazon_search_cache_updated_at 
  BEFORE UPDATE ON public.amazon_search_cache 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
