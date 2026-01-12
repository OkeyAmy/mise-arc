
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeftoverItem } from "@/data/schema";
import { Trash2, Minus, Plus } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import * as React from "react";
import { useToast } from "@/hooks/use-toast";

interface LeftoversDialogProps {
  items: LeftoverItem[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  onUpdateServings: (id: string, servings: number) => void;
  onAdd?: (leftover: Omit<LeftoverItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

export const LeftoversDialog = ({ items, isLoading, onRemove, onUpdateServings, onAdd }: LeftoversDialogProps) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newLeftover, setNewLeftover] = React.useState<{
    meal_name: string;
    servings: number;
    date_created: string;
    notes: string;
  }>({
    meal_name: "",
    servings: 1,
    date_created: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    notes: ""
  });

  const { toast } = useToast();

  const handleServingsChange = (id: string, currentServings: number, change: number) => {
    const newServings = currentServings + change;
    if (newServings >= 0) {
      onUpdateServings(id, newServings);
    }
  };

  const handleAddLeftover = () => {
    if (newLeftover.meal_name.trim() && onAdd) {
      onAdd({
        meal_name: newLeftover.meal_name.trim(),
        servings: newLeftover.servings,
        date_created: newLeftover.date_created,
        notes: newLeftover.notes.trim() || null
      });
      setNewLeftover({
        meal_name: "",
        servings: 1,
        date_created: new Date().toISOString().split('T')[0],
        notes: ""
      });
      setShowAddForm(false);
      toast({
        title: "Leftover added",
        description: `${newLeftover.meal_name} has been added to your leftovers.`,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">Your Leftovers</CardTitle>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" variant="outline" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Leftover
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {showAddForm && (
          <div className="mb-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
            <div className="space-y-3">
              <Input
                placeholder="Meal name"
                value={newLeftover.meal_name}
                onChange={(e) => setNewLeftover(prev => ({ ...prev, meal_name: e.target.value }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Servings"
                  value={newLeftover.servings}
                  onChange={(e) => setNewLeftover(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
                <Input
                  type="date"
                  value={newLeftover.date_created}
                  onChange={(e) => setNewLeftover(prev => ({ ...prev, date_created: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Notes (optional)"
                value={newLeftover.notes}
                onChange={(e) => setNewLeftover(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <Button onClick={handleAddLeftover} size="sm" disabled={!newLeftover.meal_name.trim()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button onClick={() => setShowAddForm(false)} size="sm" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">Loading leftovers...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">You have no leftovers. Good job!</div>
        ) : (
          <ScrollArea className="h-72">
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.meal_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(item.date_created).toLocaleDateString()}
                    </p>
                    {item.notes && <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">Notes: {item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 bg-background rounded-md p-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleServingsChange(item.id, item.servings, -1)} disabled={item.servings <= 0}>
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-mono w-8 text-center text-sm">{item.servings}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleServingsChange(item.id, item.servings, 1)}>
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive h-8 w-8 flex-shrink-0">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
