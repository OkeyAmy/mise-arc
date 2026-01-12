
-- Add columns to extract specific Amazon product information from the JSON
ALTER TABLE public.amazon_search_cache 
ADD COLUMN IF NOT EXISTS extracted_products JSONB DEFAULT '[]'::jsonb;

-- Create a function to extract product information from search_results
CREATE OR REPLACE FUNCTION extract_amazon_product_fields(search_results JSONB)
RETURNS JSONB AS $$
DECLARE
  product JSONB;
  extracted_product JSONB;
  result JSONB := '[]'::jsonb;
BEGIN
  -- Loop through each product in the search results array
  FOR product IN SELECT * FROM jsonb_array_elements(search_results)
  LOOP
    -- Extract all the fields from each product
    extracted_product := jsonb_build_object(
      'asin', product->>'asin',
      'product_title', product->>'product_title',
      'product_price', product->>'product_price',
      'product_original_price', product->>'product_original_price',
      'currency', product->>'currency',
      'product_star_rating', product->>'product_star_rating',
      'product_num_ratings', (product->>'product_num_ratings')::integer,
      'product_url', product->>'product_url',
      'product_photo', product->>'product_photo',
      'product_minimum_offer_price', product->>'product_minimum_offer_price',
      'product_num_offers', (product->>'product_num_offers')::integer,
      'is_best_seller', (product->>'is_best_seller')::boolean,
      'is_amazon_choice', (product->>'is_amazon_choice')::boolean,
      'is_prime', (product->>'is_prime')::boolean,
      'sales_volume', product->>'sales_volume',
      'delivery', product->>'delivery',
      'product_availability', product->>'product_availability',
      'climate_pledge_friendly', (product->>'climate_pledge_friendly')::boolean,
      'has_variations', (product->>'has_variations')::boolean,
      'product_badge', product->>'product_badge',
      'product_byline', product->>'product_byline',
      'unit_price', product->>'unit_price',
      'unit_count', (product->>'unit_count')::integer
    );
    
    -- Add the extracted product to the result array
    result := result || jsonb_build_array(extracted_product);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing records to extract product information
UPDATE public.amazon_search_cache 
SET extracted_products = extract_amazon_product_fields(search_results)
WHERE search_results IS NOT NULL AND extracted_products = '[]'::jsonb;

-- Add trigger to automatically extract product information on insert/update
CREATE OR REPLACE FUNCTION trigger_extract_amazon_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.search_results IS NOT NULL THEN
    NEW.extracted_products := extract_amazon_product_fields(NEW.search_results);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS extract_amazon_products_trigger ON public.amazon_search_cache;
CREATE TRIGGER extract_amazon_products_trigger
  BEFORE INSERT OR UPDATE ON public.amazon_search_cache
  FOR EACH ROW
  EXECUTE FUNCTION trigger_extract_amazon_products();
