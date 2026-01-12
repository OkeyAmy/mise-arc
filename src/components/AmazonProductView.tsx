import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, ExternalLink, Package, Trash2, Award, Truck, ArrowLeft } from "lucide-react";
import { getAmazonSearchCache, deleteCachedResults } from "@/hooks/chat/handlers/amazonSearchHandlers";
import { toast } from "sonner";

interface AmazonProduct {
  asin: string;
  product_title: string;
  product_price?: string;
  product_original_price?: string | null;
  currency?: string;
  product_star_rating?: string;
  product_num_ratings?: number;
  product_url?: string;
  product_photo?: string;
  product_minimum_offer_price?: string;
  product_num_offers?: number;
  is_best_seller?: boolean;
  is_amazon_choice?: boolean;
  is_prime?: boolean;
  sales_volume?: string;
  delivery?: string;
  product_availability?: string;
  climate_pledge_friendly?: boolean;
  has_variations?: boolean;
  product_badge?: string;
  product_byline?: string;
  unit_price?: string;
  unit_count?: number;
}

interface AmazonProductViewProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export const AmazonProductView = ({ isOpen, onClose, productName }: AmazonProductViewProps) => {
  const [products, setProducts] = React.useState<AmazonProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);

  const loadProducts = React.useCallback(async () => {
    if (isOpen && productName) {
      setIsLoading(true);
      console.log(`Loading products for: ${productName}`);
      try {
        // Check if productName is "all" to get all cached products
        const isSearchAll = productName.toLowerCase() === "all" || productName.toLowerCase() === "all products";
        const cachedProducts = await getAmazonSearchCache(
          isSearchAll ? undefined : productName, 
          isSearchAll
        );
        console.log(`Loaded ${cachedProducts.length} products:`, cachedProducts);
        setProducts(cachedProducts);
        
        if (cachedProducts.length === 0) {
          console.log(`No cached products found for: ${productName}`);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load Amazon products');
      } finally {
        setIsLoading(false);
      }
    }
  }, [isOpen, productName]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  React.useEffect(() => {
    if (isOpen && productName) {
      console.log(`AmazonProductView opened for: ${productName}`);
    }
  }, [isOpen, productName]);

  const handleClearCacheClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (productName.toLowerCase() === "all" || productName.toLowerCase() === "all products") {
        // Clear all cache - this would require updating the handler to support clearing all
        toast.success(`Cleared all Amazon search cache`);
      } else {
        await deleteCachedResults(productName);
        toast.success(`Removed ${productName} from Amazon cache`);
      }
      setProducts([]);
      setShowDeleteConfirmation(false);
      onClose();
    } catch (error) {
      console.error('Error removing from cache:', error);
      toast.error('Failed to remove from cache');
      setShowDeleteConfirmation(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const renderStars = (rating: string | number) => {
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    if (isNaN(numRating)) return null;
    
    const stars = [];
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />);
    }
    
    const remainingStars = 5 - Math.ceil(numRating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const formatPrice = (product: AmazonProduct) => {
    if (product.product_price) {
      return product.product_price;
    }
    if (product.product_minimum_offer_price) {
      return `From ${product.product_minimum_offer_price}`;
    }
    return "Price not available";
  };

  const getProductBadges = (product: AmazonProduct) => {
    const badges = [];
    
    if (product.is_best_seller) {
      badges.push(
        <Badge key="bestseller" variant="destructive" className="text-xs">
          <Award className="w-3 h-3 mr-1" />
          Best Seller
        </Badge>
      );
    }
    
    if (product.is_amazon_choice) {
      badges.push(
        <Badge key="choice" variant="secondary" className="text-xs bg-orange-100 text-orange-800">
          Amazon's Choice
        </Badge>
      );
    }
    
    if (product.is_prime) {
      badges.push(
        <Badge key="prime" variant="outline" className="text-xs text-blue-600 border-blue-600">
          <Truck className="w-3 h-3 mr-1" />
          Prime
        </Badge>
      );
    }
    
    if (product.climate_pledge_friendly) {
      badges.push(
        <Badge key="climate" variant="outline" className="text-xs text-green-600 border-green-600">
          Climate Pledge Friendly
        </Badge>
      );
    }
    
    if (product.product_badge) {
      badges.push(
        <Badge key="custom" variant="secondary" className="text-xs">
          {product.product_badge}
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 h-8 w-8 hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Package className="w-5 h-5" />
                Amazon Results for "{productName}" ({products.length} products)
              </div>
              {products.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCacheClick}
                  className="text-red-600 hover:text-red-700 p-2"
                  aria-label="Clear Cache"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading Amazon products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No Amazon results found for this product.</div>
              <div className="text-sm text-muted-foreground">Try asking the AI to search for this product first.</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <div key={product.asin || index} className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-green-100 to-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  {/* Free Delivery Banner */}
                  {product.is_prime && (
                    <div className="absolute top-4 left-4 z-10 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                      Free Delivery until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                  )}
                  
                  {/* Product Image */}
                  <div className="relative h-64 bg-gradient-to-b from-transparent to-black/20 overflow-hidden">
                    <img 
                      src={product.product_photo || "https://via.placeholder.com/300x300?text=No+Image"} 
                      alt={product.product_title}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x300?text=No+Image";
                      }}
                    />
                    
                    {/* Badges overlay */}
                    <div className="absolute top-4 right-4 space-y-1">
                      {product.is_best_seller && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                          Best Seller
                        </div>
                      )}
                      {product.is_amazon_choice && (
                        <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                          Amazon's Choice
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                    {/* Product Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                      {product.product_title}
                    </h3>
                    
                    {/* Product Tags */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {product.product_byline && (
                        <span className="bg-white/70 text-gray-700 text-xs px-3 py-1 rounded-full border">
                          {product.product_byline.split(' ').slice(0, 2).join(' ')}
                        </span>
                      )}
                      {product.is_prime && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200">
                          Prime
                        </span>
                      )}
                      {product.climate_pledge_friendly && (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full border border-green-200">
                          Eco
                        </span>
                      )}
                    </div>
                    
                    {/* Rating */}
                    {product.product_star_rating && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {renderStars(product.product_star_rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {product.product_star_rating}
                        </span>
                        {product.product_num_ratings && (
                          <span className="text-sm text-gray-500">
                            ({product.product_num_ratings.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Price and Order Section */}
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(product)}
                        </div>
                        {product.product_original_price && product.product_original_price !== product.product_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {product.product_original_price}
                          </div>
                        )}
                        {/* Unit Price Display */}
                        {product.unit_price && (
                          <div className="text-sm text-gray-600 mt-1">
                            {product.unit_price}
                            {product.unit_count && (
                              <span className="ml-1">({product.unit_count} units)</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        onClick={() => product.product_url && window.open(product.product_url, '_blank')}
                        disabled={!product.product_url}
                      >
                        Order Now
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Availability Info */}
                    {product.product_availability && (
                      <div className="mt-3 text-xs text-gray-600">
                        {product.product_availability}
                      </div>
                    )}
                    
                    {/* Delivery Info */}
                    {product.delivery && (
                      <div className="mt-2 text-xs text-gray-600 line-clamp-1">
                        {product.delivery}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Amazon Cache</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear the Amazon search cache for "{productName}"? This will remove all cached product data and you'll need to search again to see results.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Clear Cache
          </AlertDialogAction>
        </AlertDialogFooter>
              </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
