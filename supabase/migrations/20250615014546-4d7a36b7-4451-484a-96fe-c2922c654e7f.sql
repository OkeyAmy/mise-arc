
-- Create a table for user inventory/pantry items
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'piece',
  expiry_date DATE,
  location TEXT DEFAULT 'pantry',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_name)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for user inventory
CREATE POLICY "Users can view their own inventory" 
  ON public.user_inventory 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory items" 
  ON public.user_inventory 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items" 
  ON public.user_inventory 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items" 
  ON public.user_inventory 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for better performance
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_category ON public.user_inventory(category);
