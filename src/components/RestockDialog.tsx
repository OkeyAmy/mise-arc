
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { InventoryItem } from "@/hooks/useInventory";
import { ShoppingListItem } from "@/data/schema";
import { toast } from "sonner";

interface RestockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  deletedItem: InventoryItem | null;
  onAddToShoppingList: (items: ShoppingListItem[]) => Promise<void>;
}

export const RestockDialog = ({ isOpen, onClose, deletedItem, onAddToShoppingList }: RestockDialogProps) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToShoppingList = async () => {
    if (!deletedItem) return;
    
    setIsAdding(true);
    try {
      const shoppingItem: ShoppingListItem = {
        item: deletedItem.item_name,
        quantity: 1, // Default quantity for restocking
        unit: deletedItem.unit
      };
      
      await onAddToShoppingList([shoppingItem]);
      toast.success(`Added ${deletedItem.item_name} to your shopping list for restocking`);
      onClose();
    } catch (error) {
      toast.error("Failed to add item to shopping list");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restock Recommendation</AlertDialogTitle>
          <AlertDialogDescription>
            You've run out of <strong>{deletedItem?.item_name}</strong>. Would you like to add it to your shopping list for restocking?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>No, thanks</AlertDialogCancel>
          <AlertDialogAction onClick={handleAddToShoppingList} disabled={isAdding}>
            {isAdding ? "Adding..." : "Add to Shopping List"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
