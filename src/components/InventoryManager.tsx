
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Trash2, Edit, Plus, Search } from "lucide-react";
import { useInventory, InventoryItem, INVENTORY_CATEGORIES } from "@/hooks/useInventory";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { RestockDialog } from "./RestockDialog";
import { ShoppingListItem } from "@/data/schema";

interface InventoryManagerProps {
  session: Session | null;
  onAddToShoppingList?: (items: ShoppingListItem[]) => Promise<void>;
}

export const InventoryManager = ({ session, onAddToShoppingList }: InventoryManagerProps) => {
  const [restockDialog, setRestockDialog] = useState<{ isOpen: boolean; item: InventoryItem | null }>({
    isOpen: false,
    item: null
  });

  const handleRestockRecommendation = (item: InventoryItem) => {
    setRestockDialog({ isOpen: true, item });
  };

  const { items, isLoading, addItem, updateItem, deleteItem, getItemsByCategory, searchItems, categories } = useInventory(
    session, 
    onAddToShoppingList ? handleRestockRecommendation : undefined
  );
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    item_name: "",
    category: "other",
    quantity: 0,
    unit: "piece",
    expiry_date: "",
    location: "pantry",
    notes: ""
  });

  const handleAddItem = async () => {
    if (!newItem.item_name.trim()) {
      toast.error("Item name is required");
      return;
    }
    const { error } = await addItem(newItem);
    if (error) toast.error("Failed to add item");
    else {
      toast.success("Item added successfully");
      setNewItem({ item_name: "", category: "other", quantity: 0, unit: "piece", expiry_date: "", location: "pantry", notes: "" });
      setIsAddingItem(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    const { error } = await updateItem(editingItem.id, editingItem);
    if (error) toast.error("Failed to update item");
    else {
      toast.success("Item updated successfully");
      setEditingItem(null);
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      const { error } = await deleteItem(id);
      if (error) toast.error("Failed to delete item");
      else toast.success("Item deleted successfully");
    }
  };

  const filteredItems = searchQuery 
    ? searchItems(searchQuery)
    : selectedCategory === "all" 
      ? items 
      : getItemsByCategory(selectedCategory);

  const groupedItems = filteredItems.reduce((acc, item) => {
    const categoryKey = item.category as keyof typeof categories;
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(item);
    return acc;
  }, {} as Record<keyof typeof categories, InventoryItem[]>);

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">Home Inventory</CardTitle>
            <Button onClick={() => setIsAddingItem(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isAddingItem && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Add New Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-name">Item Name *</Label>
                    <Input id="item-name" value={newItem.item_name} onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))} placeholder="e.g., Olive Oil" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" min="0" step="0.1" value={newItem.quantity} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" value={newItem.unit} onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))} placeholder="e.g., cups, lbs, pieces" />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={newItem.location} onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))} placeholder="e.g., pantry, fridge, freezer" />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry Date (optional)</Label>
                    <Input id="expiry" type="date" value={newItem.expiry_date} onChange={(e) => setNewItem(prev => ({ ...prev, expiry_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" value={newItem.notes || ""} onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes about this item..." />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleAddItem} className="w-full sm:w-auto">Add Item</Button>
                  <Button variant="outline" onClick={() => setIsAddingItem(false)} className="w-full sm:w-auto">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading ? <div className="text-center py-4">Loading inventory...</div> : Object.keys(groupedItems).length === 0 ? <div className="text-center text-muted-foreground py-8">No items found. Add some!</div> : 
              Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">{categories[category as keyof typeof categories] || category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted rounded-lg gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium truncate">{item.item_name}</span>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">{item.quantity} {item.unit}</Badge>
                            {item.location && <Badge variant="outline" className="text-xs flex-shrink-0">{item.location}</Badge>}
                          </div>
                          {item.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>}
                          {item.expiry_date && <p className="text-xs text-muted-foreground">Expires: {new Date(item.expiry_date).toLocaleDateString()}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)} className="h-8 w-8 p-0">
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id, item.item_name)} className="h-8 w-8 p-0">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>

          {editingItem && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Edit Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Item Name *</Label><Input value={editingItem.item_name} onChange={(e) => setEditingItem(p => p ? { ...p, item_name: e.target.value } : null)} /></div>
                  <div><Label>Category</Label><Select value={editingItem.category} onValueChange={(v) => setEditingItem(p => p ? { ...p, category: v } : null)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Quantity</Label><Input type="number" min="0" step="0.1" value={editingItem.quantity} onChange={(e) => setEditingItem(p => p ? { ...p, quantity: parseFloat(e.target.value) || 0 } : null)} /></div>
                  <div><Label>Unit</Label><Input value={editingItem.unit} onChange={(e) => setEditingItem(p => p ? { ...p, unit: e.target.value } : null)} /></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleUpdateItem} className="w-full sm:w-auto">Update Item</Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)} className="w-full sm:w-auto">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <RestockDialog
        isOpen={restockDialog.isOpen}
        onClose={() => setRestockDialog({ isOpen: false, item: null })}
        deletedItem={restockDialog.item}
        onAddToShoppingList={onAddToShoppingList || (async () => {})}
      />
    </>
  );
};
