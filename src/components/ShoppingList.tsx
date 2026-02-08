import * as React from "react";
import { ShoppingListItem } from "@/data/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Download, Share2, Loader2, Plus, Copy } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ShoppingCartItem } from "./ShoppingCartItem";
import { ShoppingCartTotal } from "./ShoppingCartTotal";
import { AmazonProductView } from "./AmazonProductView";
import { useAmazonProducts } from "@/hooks/useAmazonProducts";
import { useSharedShoppingList } from "@/hooks/useSharedShoppingList";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface ShoppingListProps {
  items: ShoppingListItem[];
  onRemove: (item: string) => void;
  onUpdate?: (itemName: string, quantity: number, unit: string) => void;
  onAdd?: (items: ShoppingListItem[]) => void;
  isLoading?: boolean;
  session?: Session | null;
}

export const ShoppingList = ({ items, onRemove, onUpdate, onAdd, isLoading, session }: ShoppingListProps) => {
  const [itemToRemove, setItemToRemove] = React.useState<ShoppingListItem | null>(null);
  const [editingItem, setEditingItem] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<{ quantity: number; unit: string }>({ quantity: 0, unit: "" });
  const [viewingProduct, setViewingProduct] = React.useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string>("");

  // Add item form state
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newItem, setNewItem] = React.useState<{ item: string; quantity: number; unit: string }>({
    item: "",
    quantity: 1,
    unit: "piece"
  });

  const { createShareableLink, isCreating } = useSharedShoppingList(session);
  const { toast } = useToast();

  // Fetch Amazon products for all items
  const { products, isLoading: isProductsLoading } = useAmazonProducts(items);

  const handleRemoveClick = (item: ShoppingListItem) => {
    setItemToRemove(item);
  };

  const handleRemoveConfirm = () => {
    if (itemToRemove) {
      onRemove(itemToRemove.item);
      setItemToRemove(null);
    }
  };

  const handleRemoveCancel = () => {
    setItemToRemove(null);
  };

  const handleEditStart = (item: ShoppingListItem) => {
    setEditingItem(item.item);
    setEditValues({ quantity: item.quantity, unit: item.unit });
  };

  const handleEditSave = (quantity: number, unit: string) => {
    if (editingItem && onUpdate) {
      onUpdate(editingItem, quantity, unit);
    }
    setEditingItem(null);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
  };

  const handleViewProduct = (productName: string) => {
    setViewingProduct(productName);
  };

  const handleAddItem = () => {
    if (newItem.item.trim() && onAdd) {
      onAdd([{
        item: newItem.item.trim(),
        quantity: newItem.quantity,
        unit: newItem.unit
      }]);
      setNewItem({ item: "", quantity: 1, unit: "piece" });
      setShowAddForm(false);
      toast({
        title: "Item added",
        description: `${newItem.item} has been added to your shopping list.`,
      });
    }
  };

  const formatShoppingList = () => {
    return items
      .map((item) => `${item.item}: ${item.quantity} ${item.unit}`)
      .join('\n');
  };

  const handleDownload = () => {
    const listContent = formatShoppingList();
    const blob = new Blob([listContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shopping-list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to share",
        description: "Your shopping list is empty.",
        variant: "destructive"
      });
      return;
    }

    if (session?.user) {
      await createAndShowShareLink();
    } else if (navigator.share) {
      try {
        const listContent = formatShoppingList();
        await navigator.share({
          title: 'My Shopping List',
          text: listContent,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
          title: "Error",
          description: "Failed to share. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Sign in required",
        description: "Please sign in to create shareable links.",
        variant: "destructive"
      });
    }
  };

  const createAndShowShareLink = async () => {
    try {
      const { shareUrl: url } = await createShareableLink(items, "My Shopping List");
      setShareUrl(url);
      setShareDialogOpen(true);
    } catch (error) {
      console.error('Error creating shareable link:', error);
      toast({
        title: "Error",
        description: "Failed to create shareable link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const canShare = session?.user || (typeof navigator !== 'undefined' && !!navigator.share);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-lg sm:text-xl">Your Smart Shopping Cart</CardTitle>
              <CardDescription className="text-sm mt-1">
                Items with Amazon prices shown. Click View to see more options.
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Add Item Form */}
          {showAddForm && (
            <div className="mb-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <Input
                  placeholder="Item name"
                  value={newItem.item}
                  onChange={(e) => setNewItem(prev => ({ ...prev, item: e.target.value }))}
                  className="col-span-1 sm:col-span-1"
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                  min="0"
                  step="0.1"
                  className="col-span-1 sm:col-span-1"
                />
                <Input
                  placeholder="Unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="col-span-1 sm:col-span-1"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAddItem} size="sm" disabled={!newItem.item.trim()} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {isLoading && <div className="text-center py-4 text-muted-foreground">Loading...</div>}

            {items.map((item) => (
              <ShoppingCartItem
                key={`${item.item}-${item.unit}`}
                item={item}
                product={products.get(item.item.toLowerCase())}
                isProductLoading={isProductsLoading}
                isEditing={editingItem === item.item}
                editValues={editValues}
                onEditStart={() => handleEditStart(item)}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onEditValuesChange={setEditValues}
                onViewProduct={() => handleViewProduct(item.item)}
                onRemove={() => handleRemoveClick(item)}
                canEdit={!!onUpdate}
              />
            ))}

            {items.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-8 sm:py-12">
                No items in your cart 🛒
              </div>
            )}
          </div>

          {/* Estimated Total */}
          {items.length > 0 && (
            <div className="mt-4">
              <ShoppingCartTotal
                items={items}
                products={products}
                isLoading={isProductsLoading}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button className="w-full" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            {canShare && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleShare}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Share
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && handleRemoveCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{itemToRemove?.item}" from your shopping list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRemoveCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Shopping List</DialogTitle>
            <DialogDescription>
              Anyone with this link can import your shopping list items. The link expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyShareUrl} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              When someone opens this link, they'll be able to add these items to their own shopping list.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Amazon Product View Modal */}
      <AmazonProductView
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        productName={viewingProduct || ""}
      />
    </>
  );
};
